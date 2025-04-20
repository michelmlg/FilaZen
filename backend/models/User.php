<?php
namespace FilaZen\Backend\models;

use PDO;

class User {
    private $id;
    private $username;
    private $email;
    private $full_name;
    private $password;
    private $role;
    private $img_path;
    private $status;
    private $created_at;
    private $updated_at;

    public function __construct($username, $email, $full_name, $password, $role = 'user', $img_path = null, $status = 1) {
        $this->username = $username;
        $this->full_name = $full_name;
        $this->email = $email;
        $this->password = password_hash($password, PASSWORD_BCRYPT);
        $this->role = $role;
        $this->img_path = $img_path;
        $this->status = $status;
        $this->created_at = date("Y-m-d H:i:s");
        $this->updated_at = date("Y-m-d H:i:s");
    }

    public function store($pdo) {
        try {
            // Inicia a transação
            $pdo->beginTransaction();
    
            // Insere o usuário
            $userSql = "INSERT INTO user (username, email, full_name, password, role, img_path, created_at, updated_at) 
                    VALUES (:username, :email, :full_name, :password, :role, :img_path, :created_at, :updated_at)";
    
            $stmt = $pdo->prepare($userSql);
            $stmt->bindParam(':username', $this->username);
            $stmt->bindParam(':email', $this->email);
            $stmt->bindParam(':full_name', $this->full_name);
            $stmt->bindParam(':password', $this->password);
            $stmt->bindParam(':role', $this->role);
            $stmt->bindParam(':img_path', $this->img_path);
            $stmt->bindParam(':created_at', $this->created_at);
            $stmt->bindParam(':updated_at', $this->updated_at);
    
            $stmt->execute();
            $userId = $pdo->lastInsertId();  // Obtém o ID do usuário recém inserido
    
            // Agora insere o status do usuário
            $statusSql = "INSERT INTO user_status (user_id, status_id) VALUES (:user_id, :status_id)";
            $statusStmt = $pdo->prepare($statusSql);
            $statusStmt->bindParam(':user_id', $userId);
            $statusStmt->bindParam(':status_id', $this->status);
            
            $statusStmt->execute();
    
            // Confirma a transação
            $pdo->commit();
    
            return $userId;
        } catch (PDOException $e) {
            // Se ocorrer um erro, faz o rollback da transação
            $pdo->rollBack();
            return false;
        }
    }
    
    public function update($pdo) {
        $sql = "UPDATE user SET 
                    username = :username, 
                    email = :email, 
                    full_name = :full_name, 
                    password = :password, 
                    role = :role, 
                    img_path = :img_path, 
                    status = :status, 
                    updated_at = NOW() 
                WHERE id = :id";
    
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':img_path', $this->img_path);
        $stmt->bindParam(':status', $this->status);
    
        return $stmt->execute();
    }    
    
    // Find
    public static function findById($pdo, $id) {
        $sql = "SELECT * FROM user WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public static function findByUsername($pdo, $username) {
        $sql = "SELECT * FROM user WHERE username = :username";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public static function findByEmail($pdo, $email) {
        $sql = "SELECT * FROM user WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function getAllUsers($pdo) {
        $sql = "SELECT * FROM user";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public static function delete($pdo, $id) {
        $sql = "DELETE FROM user WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }    
    public static function getUserByToken($pdo, $token) {
        $stmt = $pdo->prepare("SELECT u.* FROM user u JOIN email_verifications ev ON u.id = ev.user_id WHERE ev.verification_token = :token");
        $stmt->bindParam(':token', $token);
        $stmt->execute();
    
        return $stmt->fetch(PDO::FETCH_ASSOC); // Retorna os dados do usuário ou `false` se não encontrar
    }
    

    // Status
    public static function getAllStatus($pdo){
        $sql = "SELECT * FROM status ORDER BY id ASC";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public static function verifyStatus($pdo, $id){
        $sql = "SELECT status_id FROM user_status WHERE user_id = :id";

        $stmt = $pdo->prepare($sql);  
        $stmt->execute(['id' => $id]);  

        return $stmt->fetch(PDO::FETCH_ASSOC); //
    }
    public static function changeStatus($pdo, $id, $status_id){
        $sql = "UPDATE user_status SET status_id = :status_id WHERE user_id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':status_id', $status_id);

        if($stmt->execute()){
            return true;
        }else{
            return false;
        }
    }

    public static function getStatus($pdo, $user_id) {
        $stmt = $pdo->prepare("SELECT status_id FROM user_status WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Email Verification
    public static function generateVerificationToken($user_id) {
        $token = bin2hex(random_bytes(16)); 
    
        $expiry_time = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
        $pdo = getConnection();  
        $result = User::storeVerificationToken($pdo, $user_id, $token, $expiry_time);
    
        return $result ? $token : false; 
    }
    
    public static function storeVerificationToken($pdo, $user_id, $token, $expiry_time) {
        $stmt = $pdo->prepare("INSERT INTO email_verifications (user_id, verification_token, token_expiry_at)
                               VALUES (:user_id, :token, :expiry_time)");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expiry_time', $expiry_time);
        return $stmt->execute();
    }

    public static function verifyEmailToken($pdo, $token) {
        $stmt = $pdo->prepare("SELECT * FROM email_verifications WHERE verification_token = :token AND is_verified = 0 AND token_expiry_at > NOW()");
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC); 
    }

    
    public static function confirmEmail($pdo, $token) {
        try {
            $stmt = $pdo->prepare("UPDATE email_verifications SET is_verified = 1 WHERE verification_token = :token");
            $stmt->bindParam(':token', $token);
            $stmt->execute();
    
            $stmt2 = $pdo->prepare("UPDATE user SET email_verificated_at = NOW() WHERE id = (SELECT user_id FROM email_verifications WHERE verification_token = :token)");
            $stmt2->bindParam(':token', $token);
            $stmt2->execute();
    
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    
}
?>
