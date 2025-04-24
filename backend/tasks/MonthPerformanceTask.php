<?php
namespace Filazen\Backend\tasks;
require_once __DIR__ . '../../../vendor/autoload.php';


use PDO;
use Exception;
use PDOException;
use Dotenv\Dotenv;
use Crunz\Schedule;
use Filazen\Backend\database\db;

try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
    $dotenv->load();
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERRO AO CARREGAR .env: " . $e->getMessage() . "\n";
}

$schedule = new Schedule();
$task = $schedule->run(function () {
    try{
        $pdo = db::getConnection();
        $sql = "
                SELECT 
                    o.employee_id AS user_id,
                    DATE_FORMAT(CURDATE(), '%Y-%m-01') AS reference_month,
                    COUNT(o.id) AS total_orders,
                    SUM(CASE WHEN o.status_id = 5 THEN (o.estimated_value - o.discount) ELSE 0 END) AS total_value,
                    SUM(CASE WHEN o.status_id = 5 THEN 1 ELSE 0 END) AS total_sells,
                    SUM(CASE WHEN o.status_id = 4 THEN 1 ELSE 0 END) AS canceled_orders,
                    0 AS average_response_time, -- Aqui você pode substituir por cálculo real, se tiver os dados
                    NOW() AS created_at,
                    NOW() AS updated_at
                FROM orders o
                INNER JOIN user u ON u.id = o.employee_id
                WHERE o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                AND o.created_at < LAST_DAY(CURDATE()) + INTERVAL 1 DAY
                GROUP BY o.employee_id;
            ";
    
        $stmt = $pdo->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        // Inserindo os dados em user_performance
        $insert = $pdo->prepare("
            INSERT INTO user_performance (
                user_id,
                reference_month,
                total_orders,
                total_sells,
                total_value,
                canceled_orders,
                average_response_time,
                created_at,
                updated_at
            ) VALUES (
                :user_id,
                :reference_month,
                :total_orders,
                :total_sells,
                :total_value,
                :canceled_orders,
                :average_response_time,
                NOW(),
                NOW()
            )
            ON DUPLICATE KEY UPDATE 
                total_orders = VALUES(total_orders),
                total_sells = VALUES(total_sells),
                total_value = VALUES(total_value),
                canceled_orders = VALUES(canceled_orders),
                average_response_time = VALUES(average_response_time),
                updated_at = NOW()
        ");
    
        foreach ($results as $row) {
            $insert->execute([
                ':user_id' => $row['user_id'],
                ':reference_month' => $row['reference_month'],
                ':total_orders' => $row['total_orders'],
                ':total_sells' => $row['total_sells'],
                ':total_value' => $row['total_value'],
                ':canceled_orders' => $row['canceled_orders'],
                ':average_response_time' => $row['average_response_time'],
            ]);
        }
    
        echo "[" . date('Y-m-d H:i:s') . "] Task finalizada com sucesso!\n";
    }catch (Exception $e) {
        echo "[" . date('Y-m-d H:i:s') . "] ERRO GERAL: " . $e->getMessage() . "\n";
    }
});
$task->veryTenMinutes(); 
// $task->dailyAt('23:59');

//
//$task->everyMinute();              // A cada minuto
//$task->everyFiveMinutes();        // A cada 5 minutos
//$task->everyTenMinutes();         // A cada 10 minutos
//$task->everyFifteenMinutes();     // A cada 15 minutos
//task->everyThirtyMinutes();      // A cada 30 minutos
//$task->hourly();                  // A cada hora
//$task->hourlyAt(15);              // A cada hora, no minuto 15

//$task->daily();                   // Uma vez por dia (meia-noite)
//$task->dailyAt('14:00');          // Todos os dias às 14:00
//$task->twiceDaily(1, 13);         // Duas vezes por dia, às 1h e às 13h
//$task->weekly();                  // Toda semana (domingo meia-noite)
//$task->weeklyOn(1, '8:30');       // Toda segunda-feira às 8h30
//$task->monthly();                 // Uma vez por mês (dia 1)
//$task->monthlyOn(15, '10:00');    // Dia 15 de cada mês às 10h
//$task->quarterly();               // A cada 3 meses
//$task->yearly();                  // Uma vez por ano (1º de janeiro)


return $schedule;