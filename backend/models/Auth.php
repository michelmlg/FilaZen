<?php
namespace Filazen\Backend\models;

// require_once __DIR__ . '../../../vendor/autoload.php';

use Filazen\Backend\models\User;


session_start();

class Auth {
    public static function getSession(){
        return $_SESSION;
    }

    public static function loginWithUsername($pdo, $username, $password) {
        
        $user = User::findByUsername($pdo, $username);

        if($user['email_verificated_at'] == null){
            return false;
        }

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_session'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'role' => $user['role'],
                'img_path' => $user['img_path']
            ];

            $_SESSION['authenticated'] = true;
            return true;
        }

        return false;
    }
    public static function loginWithEmail($pdo, $email, $password) {
        
        $user = User::findByEmail($pdo, $email);

        if($user['email_verificated_at'] == null){
            return false;
        }


        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_session'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'role' => $user['role'],
                'img_path' => $user['img_path']
            ];

            $_SESSION['authenticated'] = true;

            return true;
        }

        return false;
    }

    public static function logout() {
        session_unset();
        session_destroy();
    }

    public static function check() {
        return isset($_SESSION['authenticated']);
    }

    public static function user() {
        return self::check() ? $_SESSION['user_session'] : null;
    }
}
?>
