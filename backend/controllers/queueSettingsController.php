<?php
require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\models\Auth;
use Filazen\Backend\database\db;
use Filazen\Backend\models\QueueSettings;

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

if ($method == 'GET' && isset($inputData)) {
    try {
        $pdo = db::getConnection();
        $queueSettings = QueueSettings::getQueueSettings($pdo);
        echo json_encode(["status" => "success", "queue_settings" => $queueSettings]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}
if ($method == 'GET' && isset($inputData['key'])) {
    try {
        $key_name = filter_var($inputData['key'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);

        if (empty($key_name)) {
            echo json_encode(["status" => "error", "message" => "Chave não informada"]);
            exit;
        }

        $pdo = db::getConnection();
        $individualSetting = QueueSettings::getStrategy($pdo, $key_name);
        echo json_encode(["status" => "success", "message" => "Chave [$key_name]", "key" => $individualSetting]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}
if ($method == 'PUT' && isset($inputData['key']) && isset($inputData['value'])) {
    try {
        $key_name = filter_var($inputData['key'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        $value = filter_var($inputData['value'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);

        if (empty($key_name) || empty($value)) {
            echo json_encode(["status" => "error", "message" => "Chave ou valor não informados"]);
            exit;
        }

        $pdo = db::getConnection();

        $validKey = QueueSettings::checkStrategy($pdo, $key_name);

        if (!$validKey) {
            echo json_encode(["status" => "error", "message" => "Chave de configuração [$key_name] não existente."]);
            exit;
        }


        QueueSettings::setStrategy($pdo, $key_name, $value);
        echo json_encode(["status" => "success", "message" => "Chave [$key_name] atualizada com sucesso.", "new_value" => $value]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}


echo json_encode(["status" => "error", "message" => "Requisição inválida"]);
exit;
?>
