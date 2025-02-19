<?php
include('../database/connection.php');
include('../models/User.php');
include('../models/Queue.php');

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

// Definindo a Fila;
$queue = new Queue();


if($method == 'GET'){
    try{
        $pdo = getConnection();

        $queue->populateQueueFromDatabase($pdo);

        if($queue->size() > 0){
            echo json_encode(["status" => "success", "message" => "fila retornada com sucesso.", "queue" => $queue->getQueue()]);
        } else {
            echo json_encode(["status" => "success", "message" => "A fila está vazia."]);
        }
    }catch(PDOException $e){
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro ao retornar fila " . $e.getMessage()]);
    }finally{
        $pdo = null;
    }
    exit;
}

// Adicionar usuário manualmente
if ($method == 'POST') {

    if (!isset($inputData['id']) || !isset($inputData['name'])) {
        echo json_encode(["status" => "error", "message" => "Parâmetros incompletos"]);
        exit;
    }

    $queue->enqueue(["id" => $inputData['id'], "name" => $inputData['name']]);
    echo json_encode(["status" => "success", "message" => "Usuário adicionado à fila"]);
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
