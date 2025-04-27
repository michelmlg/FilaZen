<?php
namespace Filazen\Backend\models\Queue\Factories;

use PDO;
use Filazen\Backend\database\db;
use Filazen\Backend\interfaces\QueueStrategyInterface;
use Filazen\Backend\models\Queue\Strategies\UpdatedAtStrategy;
use Filazen\Backend\models\Queue\Strategies\PerformanceStrategy;

class StrategyFactory {
    public static function make(array $settings): QueueStrategyInterface {
        if(empty($settings)) {
            throw new \InvalidArgumentException("Settings array cannot be empty.");
        }
        
        $strategyKey = $settings['strategy'] ?? 'updated_at_strategy';


        $pdo = null;

        if($strategyKey === 'performance_strategy'){
            $pdo = db::getConnection();
        }

        $strategy_performance_criteria = $settings['strategy_performance_criteria'] ?? null;
        $strategy_updated_at_order = $settings['strategy_updated_at_order'] ?? null;

        return match ($strategyKey) {
            'random_strategy' => new RandomStrategy($pdo),
            'performance_strategy' => new PerformanceStrategy($pdo, $strategy_performance_criteria),
            'updated_at_strategy' => new UpdatedAtStrategy($strategy_updated_at_order),
            default => new UpdatedAtStrategy(),
        };
    }
    
}
