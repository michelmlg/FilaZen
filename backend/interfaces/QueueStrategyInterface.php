<?php
namespace Filazen\Backend\interfaces;

interface QueueStrategyInterface {
    public function sort(array $queue): array;
}

