<?php
require_once __DIR__ . '/helpers.php';

class Router
{
    /** @var array<int, array<string, mixed>> */
    private $routes = [];

    public function add(string $method, string $pattern, callable $handler, array $options = []): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
            'options' => $options,
            'regex' => $this->compilePattern($pattern),
        ];
    }

    private function compilePattern(string $pattern): string
    {
        $escaped = preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $pattern);
        return '#^' . $escaped . '$#';
    }

    public function dispatch(string $method, string $path): void
    {
        $body = parse_request_body();
        $effectiveMethod = strtoupper(
            $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']
                ?? ($body['_method'] ?? $method)
        );
        if (isset($body['_method'])) {
            unset($body['_method']);
        }
        foreach ($this->routes as $route) {
            if ($route['method'] !== $effectiveMethod) {
                continue;
            }

            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = urldecode($value);
                }
            }

            $context = [
                'params' => $params,
                'query' => $_GET,
                'body' => $body,
                'files' => $_FILES,
            ];

            $result = call_user_func($route['handler'], $context);
            if ($result !== null) {
                $status = 200;
                if (is_array($result) && array_key_exists('status', $result) && is_int($result['status'])) {
                    $status = $result['status'];
                }
                $payload = $result;
                if (is_array($result) && array_key_exists('data', $result)) {
                    $hasMeta =
                        array_key_exists('pagination', $result) ||
                        array_key_exists('message', $result) ||
                        array_key_exists('errors', $result);
                    $payload = $hasMeta ? $result : $result['data'];
                }
                json_response(transform_api_response($payload), $status);
            }
            return;
        }

        error_response(404, 'Route not found.');
    }
}
