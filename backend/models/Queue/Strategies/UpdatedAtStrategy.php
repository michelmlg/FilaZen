<?php
namespace Filazen\Backend\models\Queue\Strategies;
use Filazen\Backend\interfaces\QueueStrategyInterface;

class UpdatedAtStrategy implements QueueStrategyInterface {

    // Organiza a fila com base no timestamp de chegada disponibilidade dos usuários
    
    public function sort(array $queue): array {
        usort($queue, fn($a, $b) => strtotime($a['updated_at']) <=> strtotime($b['updated_at']));
        return $queue;
    }
}
