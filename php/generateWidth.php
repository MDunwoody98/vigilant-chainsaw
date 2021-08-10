<?php
session_start();
/*session is started if you don't write this line can't use $_Session  global variable*/
if (!isset($_SESSION["width"])) {
    $_SESSION["width"] = rand(5,10);
}
echo json_encode($_SESSION["width"]);
?>