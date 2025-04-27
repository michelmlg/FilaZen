<?php
namespace Filazen\Backend\models\Queue\Strategies;
use Filazen\Backend\interfaces\QueueStrategyInterface;

class RandomStrategy implements QueueStrategyInterface {

    // Deixa a fila aleatória

    public function sort(array $queue): array {
        shuffle($queue);
        return $queue;
    }
}
