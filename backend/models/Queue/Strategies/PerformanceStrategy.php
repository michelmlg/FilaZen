<?php
namespace Filazen\Backend\models\Queue\Strategies;

use Filazen\Backend\interfaces\QueueStrategyInterface;
use Filazen\Backend\database\db;
use PDO;

class PerformanceStrategy implements QueueStrategyInterface {

    private PDO $pdo;
    private string $criteria;

    public function __construct(string $criteria = 'total_value') {
        $this->pdo = db::getConnection();
        $this->criteria = $criteria;
    }

    public function sort(array $queue): array {
        $userIds = array_map(fn($user) => $user['id'], $queue);
        if (empty($userIds)) return $queue;

        $placeholders = implode(',', array_fill(0, count($userIds), '?'));

        $allowedCriteria = ['total_sells', 'total_orders', 'response_time', 'total_value'];
        if (!in_array($this->criteria, $allowedCriteria)) {
            throw new \InvalidArgumentException("Critério inválido para ordenação da fila.");
        }

        $stmt = $this->pdo->prepare("
            SELECT user_id, {$this->criteria} 
            FROM user_performance 
            WHERE reference_month = DATE_FORMAT(NOW(), '%Y-%m-01')
            AND user_id IN ($placeholders)
        ");
        $stmt->execute($userIds);
        $performances = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        usort($queue, function ($a, $b) use ($performances) {
            $aVal = $performances[$a['id']] ?? 0;
            $bVal = $performances[$b['id']] ?? 0;
            return $aVal <=> $bVal;
        });

        $this->pdo = null;
        
        return $queue;
    }
}

