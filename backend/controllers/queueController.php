<?php
require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\models\Auth;
use Filazen\Backend\Database\db;
use Filazen\Backend\models\Queue\Queue;

// include('../database/connection.php');
// include_once('../models/Auth.php');
// include_once('../models/User.php');
// include_once('../models/Queue.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Suporte para `X-HTTP-Method-Override` e `$_POST['_method']`
if ($method == 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
} elseif ($method == 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

$inputData = json_decode(file_get_contents("php://input"), true) ?? $_POST;

if(!Auth::getSession()){
    echo json_encode(["status" => "error", "message" => "Essa rota é protegida, faça login para acessá-la."]);
    exit;
}

// Definindo a Fila;
$queue = new Queue();
$pdo = db::getConnection();

if ($method == 'GET' && !isset($_GET['peek']) && !isset($_GET['list']) && !isset($_GET['size'])) {
    try {
        $queue->loadQueueFromDatabase($pdo);
        echo json_encode(["status" => "success", "message" => "Fila retornada com sucesso.", "queue" => $queue->getQueue()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao retornar fila: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}


// Adicionar usuário manualmente
if ($method == 'POST' && isset($inputData['id']) && isset($inputData['name'])) {
    try {
        $queue->loadQueueFromDatabase($pdo);
        $queue->enqueue([
            "id" => $inputData['id'],
            "full_name" => $inputData['name'],
            "img_path" => $inputData['img_path'] ?? null,
            "updated_at" => date('Y-m-d H:i:s')
        ]);
        $queue->persistQueueToDatabase($pdo);
        echo json_encode(["status" => "success", "message" => "Usuário adicionado à fila."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao adicionar usuário: " . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST' && isset($inputData['populate'])) {
    try {
        $queue->loadQueueFromDatabase($pdo);
        $queue->populateQueueFromAvailableUsers($pdo);
        echo json_encode(["status" => "success", "message" => "Fila populada com usuários disponíveis.", "queue" => $queue->getQueue()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao popular fila: " . $e->getMessage()]);
    }
    exit;
}

// Remover o primeiro usuário da fila
if ($method == 'DELETE') {
    $removedUser = $queue->dequeue();

    if ($removedUser) {
        echo json_encode(["status" => "success", "removed_user" => $removedUser]);
    } else {
        echo json_encode(["status" => "error", "message" => "A fila está vazia"]);
    }
    exit;
}

// Retornar o primeiro usuário da fila sem remover
if ($method == 'GET' && isset($_GET['peek'])) {
    $nextUser = $queue->peek();

    if ($nextUser) {
        echo json_encode(["status" => "success", "next_user" => $nextUser]);
    } else {
        echo json_encode(["status" => "error", "message" => "A fila está vazia"]);
    }
    exit;
}

// Listar toda a fila
if ($method == 'GET' && isset($_GET['list'])) {
    echo json_encode(["status" => "success", "queue" => $queue->getQueue()]);
    exit;
}

// Retornar tamanho da fila
if ($method == 'GET' && isset($_GET['size'])) {
    echo json_encode(["status" => "success", "size" => $queue->size()]);
    exit;
}

// Se nenhuma ação for reconhecida
echo json_encode(["status" => "error", "message" => "Requisição inválida"]);
exit;
?>
