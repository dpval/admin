<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'path/to/PHPMailer/src/Exception.php';
require 'path/to/PHPMailer/src/PHPMailer.php';
require 'path/to/PHPMailer/src/SMTP.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $toEmail = $_POST['toEmail'];
    $subject = $_POST['subject'];
    $body = $_POST['body'];

    $mail = new PHPMailer(true);

    try {
        //Server settings
        $mail->isSMTP();                                    
        $mail->Host = 'smtp.example.com';  // Specify your SMTP server
        $mail->SMTPAuth = true;                               
        $mail->Username = 'your_email@example.com';                 // SMTP username
        $mail->Password = 'your_email_password';                           // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;    
        $mail->Port = 465;                                    

        //Recipients
        $mail->setFrom('your_email@example.com', 'Your Name');
        $mail->addAddress($toEmail);

        //Content
        $mail->isHTML(true);                                  
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        echo 'Message has been sent';
    } catch (Exception $e) {
        echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
} else {
    echo "Invalid request";
}
?>
