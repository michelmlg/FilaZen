<?php
namespace Filazen\Backend\models\Queue\Strategies;
use Filazen\Backend\interfaces\QueueStrategyInterface;

class UpdatedAtStrategy implements QueueStrategyInterface {
    public function sort(array $queue): array {
        usort($queue, fn($a, $b) => strtotime($a['updated_at']) <=> strtotime($b['updated_at']));
        return $queue;
    }
}
