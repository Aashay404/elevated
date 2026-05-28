<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'vendor/autoload.php';

// require 'PHPMailer/class.phpmailer.php';
// require 'PHPMailer/class.smtp.php';
// header('Content-Type: text/html; charset=UTF-8');


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$host = 'localhost';
$dbname = 'u935056060_ccpf_db';
$username = 'u935056060_ccpf';
$password = '45DFjkl;';

if (!isset($_POST['clinic']) || !isset($_POST['contact-name'])) {
    echo '<div class="alert alert-danger">Form data not received properly.</div>';
    exit;
}

$clinic = $_POST['clinic'];
$name = $_POST['contact-name'];
$email = $_POST['contact-email'];
$phone = $_POST['contact-phone'];
$date = $_POST['contact-date'];
$time = $_POST['contact-time'];

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    echo '<div class="alert alert-danger">Database Connection Failed</div>';
    exit;
}

$stmt = $conn->prepare("INSERT INTO appointments2 (clinic, name, email, phone, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $clinic, $name, $email, $phone, $date, $time);

if ($stmt->execute()) {
    // Load clinic emails from JSON file
    $clinicEmailsJson = file_get_contents('../../clinic_emails.json');
    $clinicEmails = json_decode($clinicEmailsJson, true);
    
    if (!$clinicEmails) {
        echo '<div class="alert alert-warning">Appointment saved but email configuration error.</div>';
        exit;
    }
    
    $doctor_email = $clinicEmails[$clinic]['email'] ?? "ccpfnsk@gmail.com";
    $clinicName = $clinicEmails[$clinic]['name'] ?? 'Unknown Clinic';
    $admin_email = "ccpfnsk@gmail.com";  
    
    $mail = new PHPMailer();
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'ccpfnsk@gmail.com';
    $mail->Password = 'vjio usvq rqif kezg';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;
    $mail->SMTPDebug = 0;
    
    
    
    
    
    $mail->setFrom('ccpfnsk@gmail.com', 'CCPF Appointment');
    $mail->addAddress($doctor_email);
    $mail->addAddress($admin_email);
    $mail->addReplyTo($email, $name);
    
    $mail->isHTML(false);
    $mail->Subject = "New Appointment - $clinicName";
    $mail->Body = "New Appointment Booked\n\nName: $name\nPhone: $phone\nEmail: $email\nDate: $date\nTime: $time\nClinic: $clinicName (ID: $clinic)";
    
    if($mail->send()) {
        echo '<div class="alert alert-success">Appointment booked successfully! Email sent to doctor and admin.</div>';
    } else {
        echo '<div class="alert alert-success">Appointment booked successfully! Email failed to send.</div>';
    }
} else {
    echo '<div class="alert alert-danger">Database error: '.$stmt->error.'</div>';
}

$stmt->close();
$conn->close();
?>