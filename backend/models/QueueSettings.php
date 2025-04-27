<?php
namespace Filazen\Backend\models;

use PDO;

class QueueSettings {
    
    public static function getStrategy($pdo, string $key): ?string {
        $stmt = $pdo->prepare("SELECT key_name, value FROM queue_settings WHERE key_name = $key LIMIT 1");
        $stmt->execute();
        return $stmt->fetchColumn() ?: null;
    }

    public static function setStrategy($pdo, string $key, string $value): bool {
        $stmt = $pdo->prepare("UPDATE queue_settings SET value = :value WHERE key_name = :key");
        $stmt->execute([':key' => $key, ':value' => $value]);
        return true;
    }

    public static function checkStrategy($pdo, string $key): bool {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM queue_settings WHERE key_name = :key");
        $stmt->execute([':key' => $key]);
        return $stmt->fetchColumn() > 0;
    }

    public static function getQueueSettings($pdo): array {
        $stmt = $pdo->query("SELECT key_name, value FROM queue_settings");
        return $stmt->fetchAll(PDO::FETCH_KEY_PAIR); 
    }
    
}
