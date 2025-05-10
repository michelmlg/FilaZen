<?php

require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\models\Auth;
use Filazen\Backend\models\User;
use Filazen\Backend\database\db;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
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


if ($method == 'GET') {
    try {
        $pdo = db::getConnection();

        $status_list = User::getAllStatus($pdo);

        echo json_encode(["status" => "success", "status_list" => $status_list]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}

if ($method == 'POST') {
    try {
        $pdo = db::getConnection();

        if (!isset($inputData['id'])) {
            throw new Exception("ID do usuário não enviado.");
        }

        $user_id = $inputData['id'];
        $statusData = User::verifyStatus($pdo, $user_id);

        echo json_encode(["status" => "success", "id_status" => $statusData['status_id'], "status_name" => $statusData['status_name']]);
    } catch (Exception | PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}

if ($method == 'PUT') {
    try {
        $pdo = db::getConnection();

        if (!isset($inputData['id']) || !isset($inputData['new_status'])) {
            throw new Exception("Parâmetros incompletos.");
        }

        $user_id = $inputData['id'];
        $new_status = $inputData['new_status'];

        $change_status = User::changeStatus($pdo, $user_id, $new_status);

        echo json_encode([
            "status" => "success",
            "user_id" => $user_id,
            "new_status" => $new_status,
            "is_status_changed" => $change_status
        ]);
    } catch (Exception | PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Erro: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}

?>
