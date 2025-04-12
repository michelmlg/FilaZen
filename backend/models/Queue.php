<?php
// namespace Filazen\Backend\Models;

class Queue {
    private $queue = [];

    public function enqueue(array $userData): void {
        $this->queue[] = $userData; // Adiciona o usuário ao final da fila
    }

    public function dequeue(): ?array {
        if ($this->isEmpty()) {
            return null;
        }
        
        return array_shift($this->queue); // Remove e retorna o primeiro usuário da fila
    }

    public function peek(): ?array {
        return $this->isEmpty() ? null : $this->queue[0]; // Retorna o primeiro da fila sem remover
    }

    public function isEmpty(): bool {
        return empty($this->queue);
    }

    public function size(): int {
        return count($this->queue);
    }

    public function getQueue(): array {
        return $this->queue;
    }

    public function populateQueueFromDatabase($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT u.id as id, u.full_name as full_name, u.img_path as img_path, us.updated_at as updated_at FROM user u JOIN user_status us ON u.id = us.user_id WHERE us.status_id = 3 ORDER BY us.updated_at ASC");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Verificar se o array está vazio
            if (empty($users)) {
                return null;
            }
        
            // Caso haja usuários, processá-los
            foreach ($users as $user) {
                $this->enqueue($user);
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao buscar usuários: " . $e->getMessage()]);
            exit;
        }
    }

}
