<?php
// Copies existing uploaded files from backend/uploads/* to backend/public/uploads/*
// without deleting the originals (safe for production).

$sourceDir = __DIR__ . '/../uploads';
$targetDir = __DIR__ . '/../public/uploads';

if (!is_dir($sourceDir)) {
    echo "Nothing to copy (source directory missing): {$sourceDir}\n";
    exit(0);
}

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$copied = 0;
$skipped = 0;

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($sourceDir, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    /** @var SplFileInfo $file */
    if (!$file->isFile()) {
        continue;
    }

    $relative = ltrim(str_replace($sourceDir, '', $file->getPathname()), DIRECTORY_SEPARATOR);
    $destination = $targetDir . DIRECTORY_SEPARATOR . $relative;
    $destinationDir = dirname($destination);
    if (!is_dir($destinationDir)) {
        mkdir($destinationDir, 0755, true);
    }

    if (file_exists($destination)) {
        $skipped++;
        continue;
    }

    if (@copy($file->getPathname(), $destination)) {
        $copied++;
    } else {
        $skipped++;
    }
}

echo "Copy complete.\n";
echo "Copied: {$copied}\n";
echo "Skipped: {$skipped}\n";

