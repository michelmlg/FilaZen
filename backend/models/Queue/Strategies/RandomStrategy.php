<?php
namespace Filazen\Backend\models\Queue\Strategies;

use Filazen\Backend\interfaces\QueueStrategyInterface;
use PDO;

class RandomStrategy implements QueueStrategyInterface {

    private ?PDO $pdo;

    public function __construct(PDO $pdo) {
        // A conexão PDO é injetada diretamente ao criar a instância da estratégia
        $this->pdo = $pdo;
    }

    public function sort(array $queue): array {
        // Consultar o banco de dados para pegar o último pedido
        $stmt = $this->pdo->prepare("SELECT created_at FROM orders ORDER BY created_at DESC LIMIT 1");
        $stmt->execute();
        $lastOrder = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verifique se o último pedido foi encontrado
        if ($lastOrder) {
            // Usar o timestamp do último pedido como seed para aleatorização
            $lastOrderTimestamp = strtotime($lastOrder['created_at']);
            mt_srand($lastOrderTimestamp); // Inicializa o gerador de números aleatórios com o timestamp do último pedido
        }

        shuffle($queue);  // Aleatoriza a fila com o novo seed

        return $queue;
    }
}
