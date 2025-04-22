<?php
namespace Filazen\Backend\models\Queue;
// include_once __DIR__ . '/../interfaces/QueueStrategyInterface.php';

use Filazen\Backend\interfaces\QueueStrategyInterface;
use PDO;
use PDOException;

class Queue {
    private $queue = [];
    private QueueStrategyInterface $strategy;

    public function __construct() {
        $this->queue = []; // Inicializa a fila como um array vazio
        $this->strategy = new \Filazen\Backend\models\Queue\Strategies\UpdatedAtStrategy;
    }
    
    public function setStrategy(QueueStrategyInterface $strategy): void {
        $this->strategy = $strategy;
        $this->reorderQueue();
    }

    public function enqueue(array $userData): void {
        $this->queue[] = $userData;
        $this->reorderQueue();
    }

    public function dequeue(): ?array {
        return $this->isEmpty() ? null : array_shift($this->queue);
    }

    public function peek(): ?array {
        return $this->isEmpty() ? null : $this->queue[0];
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

    public function reorderQueue(): void {
        if ($this->strategy !== null) {
            $this->queue = $this->strategy->sort($this->queue);
        }
    }

    public function persistQueueToDatabase(PDO $pdo): void {
        try {
            // Limpa a fila atual no banco
            $pdo->exec("DELETE FROM queue");
    
            $stmt = $pdo->prepare("INSERT INTO queue (user_id, position) VALUES (:user_id, :position)");
    
            foreach ($this->queue as $position => $user) {
                $stmt->execute([
                    ':user_id' => $user['id'],
                    ':position' => $position,
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao salvar a fila: " . $e->getMessage()]);
            exit;
        }
    }

    public function loadQueueFromDatabase(PDO $pdo): void {
        try {
            $stmt = $pdo->prepare("
                SELECT q.position, u.id, u.full_name, u.img_path, us.updated_at
                FROM queue q
                JOIN user u ON u.id = q.user_id
                JOIN user_status us ON u.id = us.user_id
                ORDER BY q.position ASC
            ");
            $stmt->execute();
            $this->queue = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao carregar a fila: " . $e->getMessage()]);
            exit;
        }
    }


    public function reorderQueueWithNewStrategy(QueueStrategyInterface $newStrategy, PDO $pdo): void {
        $this->setStrategy($newStrategy);   
        $this->reorderQueue();              
        $this->persistQueueToDatabase($pdo);
    }

    public function populateQueueFromAvailableUsers(PDO $pdo): void {
        try {
            // Carrega a fila atual do banco
            $this->loadQueueFromDatabase($pdo);
    
            // Cria um array com os IDs dos usuários que já estão na fila
            $existingUserIds = array_column($this->queue, 'id');
    
            // Busca usuários com status "Disponível" (status_id = 3)
            $stmt = $pdo->prepare("
                SELECT u.id as id, u.full_name as full_name, u.img_path as img_path, us.updated_at as updated_at
                FROM user u
                JOIN user_status us ON u.id = us.user_id
                WHERE us.status_id = 3
            ");
            $stmt->execute();
            $availableUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            if (empty($availableUsers)) {
                return; // Ninguém disponível, mantemos a fila como está
            }
    
            // Adiciona apenas os usuários que ainda não estão na fila
            foreach ($availableUsers as $user) {
                if (!in_array($user['id'], $existingUserIds)) {
                    $this->queue[] = $user; // adiciona no final
                }
            }
             //var_dump($this->queue);
            // Reordena se houver estratégia
            $this->reorderQueue();
    
            // Persiste no banco
            $this->persistQueueToDatabase($pdo);
    
        } catch (PDOException $e) {
            echo json_encode([
                "status" => "error",
                "message" => "Erro ao popular a fila: " . $e->getMessage()
            ]);
            exit;
        }
    }
    
    


    // public function populateQueueFromDatabase($pdo) {
    //     try {
    //         $stmt = $pdo->prepare("SELECT u.id as id, u.full_name as full_name, u.img_path as img_path, us.updated_at as updated_at FROM user u JOIN user_status us ON u.id = us.user_id WHERE us.status_id = 3 ORDER BY us.updated_at ASC");
    //         $stmt->execute();
    //         $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
    //         // Verificar se o array está vazio
    //         if (empty($users)) {
    //             return null;
    //         }
        
    //         // Caso haja usuários, processá-los
    //         foreach ($users as $user) {
    //             $this->enqueue($user);
    //         }
    //     } catch (PDOException $e) {
    //         echo json_encode(["status" => "error", "message" => "Erro ao buscar usuários: " . $e->getMessage()]);
    //         exit;
    //     }
    // }

}
