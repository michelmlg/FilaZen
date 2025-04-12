<?php
// namespace Backend\Models;

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
        $order_id,
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
        $this->id = $order_id ?? null;
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

    public static function getAllOrders($page = 1, $perPage = 10, $search = null)
    {
        $offset = ($page - 1) * $perPage;
        $pdo = getConnection();

        $query = "SELECT o.id as order_id, os.name as status, c.name as client_name, oo.name as origin, 
                        u.full_name as seller_name, o.description, o.estimated_value, 
                        o.discount, o.created_at, o.delivery_date
                FROM orders o
                INNER JOIN order_status os ON o.status_id = os.id
                INNER JOIN order_origin oo ON o.origin_id = oo.id
                INNER JOIN client c ON o.client_id = c.id
                INNER JOIN user u ON o.employee_id = u.id";

        if (!empty($search)) {
            $query .= " WHERE c.name LIKE :search 
                        OR u.full_name LIKE :search 
                        OR o.description LIKE :search";
        }

        $query .= " ORDER BY o.created_at DESC 
                    LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($query);

        if (!empty($search)) {
            $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit', (int) $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    public static function countAllOrders($search = null)
    {
        $pdo = getConnection();

        $query = "SELECT COUNT(*) as total
                FROM orders o
                INNER JOIN order_status os ON o.status_id = os.id
                INNER JOIN order_origin oo ON o.origin_id = oo.id
                INNER JOIN client c ON o.client_id = c.id
                INNER JOIN user u ON o.employee_id = u.id";

        if (!empty($search)) {
            $query .= " WHERE c.name LIKE :search 
                        OR u.full_name LIKE :search 
                        OR o.description LIKE :search";
        }

        $stmt = $pdo->prepare($query);

        if (!empty($search)) {
            $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }

        $stmt->execute();
        return (int) $stmt->fetchColumn();
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
        $sql = "SELECT 
                    o.id as id,
                    o.status_id as status_id,
                    os.name as status,
                    o.origin_id as origin_id,
                    oo.name as origin,
                    o.client_id as client_id,
                    c.name as client_name,
                    o.employee_id as employee_id,
                    u.full_name as employee_name,
                    o.description as description,
                    o.estimated_value as estimated_value,
                    o.discount as discount,
                    o.created_at as created_at,
                    o.delivery_date as delivery_date,
                    o.notes as notes
                FROM orders o
                LEFT JOIN client c ON c.id = o.client_id
                LEFT JOIN user u ON u.id = o.employee_id
                LEFT JOIN order_status os ON os.id = o.status_id
                LEFT JOIN order_origin oo ON oo.id = o.origin_id
                WHERE o.employee_id = :employee_id AND o.status_id != 4 ORDER BY o.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':employee_id', $employee_id, PDO::PARAM_INT);
        if (!$stmt->execute()) {
            var_dump($stmt->errorInfo()); // Exibe erros SQL
        }
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