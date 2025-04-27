<?php
namespace Filazen\Backend\models\Queue\Strategies;

use Filazen\Backend\interfaces\QueueStrategyInterface;

class UpdatedAtStrategy implements QueueStrategyInterface {
    
    private string $order;

    public function __construct(string $order = 'ASC') {
        // Define o valor padrão como 'ASC', mas você pode passar 'DESC' quando necessário
        $this->order = strtoupper($order) === 'DESC' ? 'DESC' : 'ASC';
    }

    public function sort(array $queue): array {
        usort($queue, function ($a, $b) {
            // Converte para timestamp e compara, com base na ordem definida (ASC ou DESC)
            $comparison = strtotime($a['updated_at']) <=> strtotime($b['updated_at']);
            return $this->order === 'DESC' ? -$comparison : $comparison;
        });

        return $queue;
    }
}
