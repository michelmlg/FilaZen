<?php
namespace Filazen\Backend\tasks;
require_once __DIR__ . '../../../vendor/autoload.php';


use PDO;
use Exception;
use PDOException;
use Dotenv\Dotenv;
use Crunz\Schedule;
use Filazen\Backend\database\db;
use Filazen\Backend\services\QueueManager;
use Filazen\Backend\models\QueueSettings;

// Ativar a exibição de erros
// ini_set('display_errors', 1);
// error_reporting(E_ALL);


// set_error_handler(function($severity, $message, $file, $line) {
//     // Captura todos os tipos de erro (aviso, erro, etc)
//     echo "Erro detectado: $message na linha $line do arquivo $file\n";
//     // Opcionalmente, podemos parar a execução, se necessário
//     // exit; 
// });


try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
    $dotenv->load();
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERRO AO CARREGAR .env: " . $e->getMessage() . "\n";
}

$schedule = new Schedule();

try {
    $pdo_settings = db::getConnection();
    $settings = QueueSettings::getQueueSettings($pdo_settings);
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERRO AO CARREGAR AS CONFIGURAÇÕES DA FILA: " . $e->getMessage() . "\n";
    //exit; // Encerra a execução se as configurações não puderem ser carregadas
}


//Cria Intervalo de execução
$refresh_interval = $settings['refresh_interval'];
$refresh_time_unit = $settings['refresh_time_unit'];

$cronIntervalExpression = '';
switch ($refresh_time_unit) {
    case 'minutes':
        // Executa a cada X minutos
        $cronIntervalExpression = "*/$refresh_interval * * * *"; // A cada X minutos
        break;

    case 'hours':
        // Executa a cada X horas
        $cronIntervalExpression = "0 */$refresh_interval * * *"; // A cada X horas
        break;

    default:
        // Caso não seja reconhecido, executa a cada minuto
        $cronIntervalExpression = "*/$refresh_interval * * * *"; // A cada X minutos
        break;
}




$task = $schedule->run(function (){
    echo "Iniciando a tarefa QueueOrchestratorTask \n";
    echo "\n";

    try {
        $pdo = db::getConnection();
        
        echo "[" . date('Y-m-d H:i:s') . "] CONEXÃO COM O BANCO DE DADOS REALIZADA COM SUCESSO!\n";
        echo "\n";
    } catch (PDOException $e) {
        echo "[" . date('Y-m-d H:i:s') . "] ERRO AO CONECTAR AO BANCO DE DADOS: " . $e->getMessage() . "\n";
        echo "\n";
    }

    try{
        $queue = new QueueManager($pdo);

        //var_dump($queue); // Exibe o objeto instanciado, se tudo correr bem
        echo "[" . date('Y-m-d H:i:s') . "] FILA INSTANCIADA COM SUCESSO!\n";
    }catch (Exception $e) {
        //var_dump($e);
        echo "[" . date('Y-m-d H:i:s') . "] ERRO AO INSTANCIAR A FILA: " . $e->getMessage() . "\n";
        echo "\n";
    }
    
    
    try {

        $settings = $queue->getSettings();
        // Verifica se a fila está travada antes de continuar
        if ($settings['queue_locked'] === 'true') {
            echo "Fila está travada. Portanto não será atualizada! \n";
            return;
        }

        // Executa as operações da fila
        $queue->populateQueue();
        $queue->getQueue()->persistQueueToDatabase($pdo);

        var_dump($settings);
        $strategy = $queue->getQueue()->getStrategy();
        var_dump($strategy);

        echo "[" . date('Y-m-d H:i:s') . "] FILA ATUALIZADA COM SUCESSO!\n";
    } catch (PDOException $e) {
        echo "[" . date('Y-m-d H:i:s') . "] ERRO AO ATUALIZAR A FILA: " . $e->getMessage() . "\n";
    } catch (Exception $e) {
        echo "[" . date('Y-m-d H:i:s') . "] ERRO INESPERADO: " . $e->getMessage() . "\n";
    } finally {
        $pdo = null; // Fecha a conexão com o banco
    }
});

// Validação da expressão cron
// if (empty($cronIntervalExpression)) {
//     echo "[" . date('Y-m-d H:i:s') . "] ERRO: A expressão cron não foi gerada corretamente.\n";
//     exit; 
// }

// Definir a tarefa com a expressão cron
//$task->cron($cronIntervalExpression);

$task->everyMinute(); // Para fins de teste, executa a cada minuto
return $schedule;
