<?php

class Order {
    private $id;
    private $status_id;
    private $client_id;
    private $employee_id;
    private $description;
    private $origin_id;
    private $estimated_value;
    private $discount;
    private $delivery_date;
    private $notes;
    private $created_at;
    private $updated_at;

    public function __construct(
        $status_id,
        $client_id,
        $employee_id,
        $description,
        $origin_id,
        $estimated_value,
        $discount,
        $delivery_date,
        $notes
    ) {
        $this->status_id = $status_id;
        $this->client_id = $client_id;
        $this->employee_id = $employee_id;
        $this->description = $description;
        $this->origin_id = $origin_id;
        $this->estimated_value = $estimated_value;
        $this->discount = $discount;
        $this->delivery_date = $delivery_date;
        $this->notes = $notes;
        $this->created_at = date("Y-m-d H:i:s");
        $this->updated_at = date("Y-m-d H:i:s");
    }

    public static function getOrderById($pdo, $id) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            return $order;
        } catch (Exception $e) {
            error_log("Error fetching order by ID: " . $e->getMessage());
            return false;
        }
    }

    public function store($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO orders (status_id, client_id, employee_id, description, origin_id, estimated_value, discount, delivery_date, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $stmt->execute([
                $this->status_id,
                $this->client_id,
                $this->employee_id,
                $this->description,
                $this->origin_id,
                $this->estimated_value,
                $this->discount,
                $this->delivery_date,
                $this->notes
            ]);

            return $pdo->lastInsertId();
        } catch (Exception $e) {
            error_log("Error storing order: " . $e->getMessage());
            return false;
        }
    }

    public static function getAllOrders($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM orders");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting all orders: " . $e->getMessage());
            return [];
        }
    }

    public static function getAllOrderStatuses($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM order_status");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting all order statuses: " . $e->getMessage());
            return [];
        }
    }

    public static function getAllOrderOrigins($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM order_origin");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error getting all order origins: " . $e->getMessage());
            return [];
        }
    }

    public function update($pdo) {
        $sql = "UPDATE orders SET 
                    status_id = :status_id,
                    client_id = :client_id,
                    employee_id = :employee_id,
                    description = :description,
                    estimated_value = :estimated_value,
                    discount = :discount,
                    delivery_date = :delivery_date,
                    notes = :notes,
                    origin_id = :origin_id,
                    updated_at = NOW()
                WHERE id = :id";
    
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':status_id', $this->status_id);
        $stmt->bindParam(':client_id', $this->client_id);
        $stmt->bindParam(':employee_id', $this->employee_id);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':estimated_value', $this->estimated_value);
        $stmt->bindParam(':discount', $this->discount);
        $stmt->bindParam(':delivery_date', $this->delivery_date);
        $stmt->bindParam(':notes', $this->notes);
        $stmt->bindParam(':origin_id', $this->origin_id);
    
        return $stmt->execute();
    }

    public static function delete($pdo, $id) {
        $sql = "DELETE FROM orders WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public static function findById($pdo, $id) {
        $sql = "SELECT * FROM orders WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function findByClientId($pdo, $client_id) {
        $sql = "SELECT * FROM orders WHERE client_id = :client_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':client_id', $client_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function findByEmployeeId($pdo, $employee_id) {
        $sql = "SELECT * FROM orders WHERE employee_id = :employee_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':employee_id', $employee_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function findByDescription($pdo, $description) {
        $sql = "SELECT * FROM orders WHERE description LIKE :description";
        $stmt = $pdo->prepare($sql);
        $searchTerm = "%{$description}%";
        $stmt->bindParam(':description', $searchTerm, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    // Interactions:
    public static function getInteractions($pdo, $id) {
        $sql = "SELECT order_id, created_at, created_by, type, body FROM order_interactions WHERE order_id = :order_id ORDER BY created_at ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':order_id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function addInteraction($pdo, $id, $type, $body, $created_by) {
        try {
            $sql = "INSERT INTO order_interactions (order_id, type, body, created_by, created_at) 
                    VALUES (:order_id, :type, :body, :created_by, NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':order_id' => $id,
                ':type' => $type,
                ':body' => $body,
                ':created_by' => $created_by
            ]);
            return $pdo->lastInsertId();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
}

?>