<?php
namespace Filazen\Backend\services;

use Filazen\Backend\models\Queue;
use Filazen\Backend\models\QueueSettings;
use Filazen\Backend\models\Queue\Factories\StrategyFactory;
use PDO;

class QueueManager {
    private Queue $queue;
    private array $settings;
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;

        // Carrega a estratégia e critério do banco
        $this->settings = QueueSettings::getQueueSettings();
        $strategy = StrategyFactory::make($this->settings['strategy'] ?? 'updated_at', $this->settings['criterion'] ?? 'updated_at');

        // Cria a fila com a estratégia
        $this->queue = new Queue();
        $this->queue->setStrategy($strategy);

        // Carrega a fila do banco (se desejar manter estado)
        $this->queue->loadQueueFromDatabase($pdo);
    }

    public function getQueue(): Queue {
        return $this->queue;
    }

    public function addUser(array $userData): void {
        $this->queue->enqueue($userData);
        $this->queue->persistQueueToDatabase($this->pdo);
    }

    public function populateFromAvailableUsers(): void {

        if ($config['queue_locked'] === 'true') {
            echo "Fila está travada.\n";
            return;
        }


        $this->queue->populateQueueFromAvailableUsers($this->pdo);
    }

   
}
