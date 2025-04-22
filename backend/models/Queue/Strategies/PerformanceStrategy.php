<?php
namespace Filazen\Backend\models\Queue\Strategies;
use Filazen\Backend\interfaces\QueueStrategyInterface;

class PerformanceStrategy implements QueueStrategyInterface {
    public function sort(array $queue): array {
        usort($queue, function ($a, $b) {
            return ($b['sales_total'] ?? 0) <=> ($a['sales_total'] ?? 0);
        });
        return $queue;
    }
}
