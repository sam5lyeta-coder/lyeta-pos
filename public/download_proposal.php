<?php
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'en';

if ($lang === 'sw') {
    $file = __DIR__ . '/Lyeta_Classic_POS_Proposal_SW.html';
    $filename = 'Lyeta_Classic_POS_Proposal_SW.html';
} else {
    $file = __DIR__ . '/Lyeta_Classic_POS_Proposal_EN.html';
    $filename = 'Lyeta_Classic_POS_Proposal_EN.html';
}

if (file_exists($file)) {
    header('Content-Description: File Transfer');
    header('Content-Type: text/html');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
} else {
    http_response_code(404);
    echo "Proposal file not found.";
}
