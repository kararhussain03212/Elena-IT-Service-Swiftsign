<?php
// Minimal cURL-based HTTP client + assertion helpers for the black-box API
// integration tests in this directory. No Composer/PHPUnit — this project is
// intentionally dependency-free (see backend/package.json), so the test
// harness follows the same philosophy.

define('API_BASE', getenv('API_BASE') ?: 'http://127.0.0.1:5000');

$GLOBALS['__pass'] = 0;
$GLOBALS['__fail'] = 0;
$GLOBALS['__fail_messages'] = [];
$GLOBALS['__current_test'] = '';

function api_request(string $method, string $path, $body = null, ?string $token = null, array $extraHeaders = []): array
{
    $url = API_BASE . $path;
    $ch = curl_init($url);
    $headers = $extraHeaders;

    if ($body !== null && !($body instanceof MultipartBody)) {
        $headers[] = 'Content-Type: application/json';
        $payload = json_encode($body);
    } elseif ($body instanceof MultipartBody) {
        $payload = $body->toCurlPayload();
    } else {
        $payload = null;
    }

    if ($token !== null) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 15,
    ]);
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }

    // A long-running sequential suite occasionally sees a single transient cURL-level
    // failure on Windows (observed as CURLE_ABORTED_BY_CALLBACK on an otherwise-healthy
    // connection) unrelated to the server's actual behavior. Retry once before failing
    // the test on it.
    $raw = curl_exec($ch);
    if ($raw === false) {
        $error = curl_error($ch);
        curl_close($ch);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 15,
        ]);
        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        }
        $raw = curl_exec($ch);
        if ($raw === false) {
            $retryError = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException("cURL error for $method $path (after retry): $retryError (first attempt: $error)");
        }
    }
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($raw, true);
    return [
        'status' => $status,
        'body' => json_last_error() === JSON_ERROR_NONE ? $decoded : $raw,
        'raw' => $raw,
    ];
}

class MultipartBody
{
    private array $fields;
    public function __construct(array $fields) { $this->fields = $fields; }
    public function toCurlPayload(): array
    {
        $out = [];
        foreach ($this->fields as $key => $value) {
            if (is_string($value) && str_starts_with($value, '@')) {
                $out[$key] = new CURLFile(substr($value, 1));
            } else {
                $out[$key] = $value;
            }
        }
        return $out;
    }
}

function test(string $name, callable $fn): void
{
    $GLOBALS['__current_test'] = $name;
    try {
        $fn();
        $GLOBALS['__pass']++;
        echo "  PASS  $name\n";
    } catch (Throwable $e) {
        $GLOBALS['__fail']++;
        $GLOBALS['__fail_messages'][] = "$name :: " . $e->getMessage();
        echo "  FAIL  $name -- " . $e->getMessage() . "\n";
    }
}

function assert_status(array $response, int $expected, string $context = ''): void
{
    if ($response['status'] !== $expected) {
        $bodyPreview = is_string($response['body']) ? $response['body'] : json_encode($response['body']);
        throw new RuntimeException("$context expected status $expected, got {$response['status']}: " . substr((string) $bodyPreview, 0, 300));
    }
}

function assert_true($cond, string $message): void
{
    if (!$cond) {
        throw new RuntimeException($message);
    }
}

function assert_has_key(array $arr, string $key, string $context = ''): void
{
    if (!array_key_exists($key, $arr)) {
        throw new RuntimeException("$context expected key '$key' in response, got keys: " . implode(',', array_keys($arr)));
    }
}

function summary(): int
{
    $pass = $GLOBALS['__pass'];
    $fail = $GLOBALS['__fail'];
    echo "\n" . str_repeat('=', 60) . "\n";
    echo "TOTAL: " . ($pass + $fail) . "   PASS: $pass   FAIL: $fail\n";
    if ($fail > 0) {
        echo "\nFailures:\n";
        foreach ($GLOBALS['__fail_messages'] as $m) {
            echo "  - $m\n";
        }
    }
    echo str_repeat('=', 60) . "\n";
    return $fail > 0 ? 1 : 0;
}
