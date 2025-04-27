<?php
namespace Filazen\Backend\models\Queue\Factories;

use Filazen\Backend\models\Queue\Strategies\PerformanceStrategy;
use Filazen\Backend\models\Queue\Strategies\UpdatedAtStrategy;
use Filazen\Backend\interfaces\QueueStrategyInterface;
use PDO;

class StrategyFactory {
    public static function make(string $strategyKey, ?string $criterion = null): QueueStrategyInterface {
        return match ($strategyKey) {
            'random_strategy' => new RandomStrategy(),
            'performance_strategy' => new PerformanceStrategy($criterion ?? 'updated_at'),
            'updated_at_strategy' => new UpdatedAtStrategy(),
            default => new UpdatedAtStrategy(),
        };
    }
    
}
