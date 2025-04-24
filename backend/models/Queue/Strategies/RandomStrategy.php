<?php
namespace Filazen\Backend\models\Queue\Strategies;
use Filazen\Backend\interfaces\QueueStrategyInterface;

class RandomStrategy implements QueueStrategyInterface {
    public function sort(array $queue): array {
        shuffle($queue);
        return $queue;
    }
}
