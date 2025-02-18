<?php

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
        $sql = "INSERT INTO user (username, email, full_name, password, role, img_path, status, created_at, updated_at) 
                VALUES (:username, :email, :full_name, :password, :role, :img_path, :status, :created_at, :updated_at)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':img_path', $this->img_path);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':created_at', $this->created_at);
        $stmt->bindParam(':updated_at', $this->updated_at);

        if($stmt->execute()){
            return $pdo->lastInsertId();
        }else{
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
    
    public static function delete($pdo, $id) {
        $sql = "DELETE FROM user WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }    

    public static function getAllUsers($pdo) {
        $sql = "SELECT * FROM user";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getAllStatus($pdo){
        $sql = "SELECT * FROM user_status ORDER BY id ASC";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function verifyStatus($pdo, $id){
        $sql = "SELECT u.status as id, us.name as name FROM user u JOIN user_status us ON u.status = us.id WHERE u.id = :id";

        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function changeStatus($pdo, $id, $status_id){
        $sql = "UPDATE user SET status = :id_status WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':id_status', $status_id);

        if($stmt->execute()){
            return true;
        }else{
            return false;
        }
    }
    
}
?>
