<!DOCTYPE html>
<html lang="en" class="notranslate" translate="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google" content="notranslate">
    <title>Lyeta Classic - Enterprise POS</title>
    
    <!-- Hizi amri mbili ndio zinabeba "daraja" la kuleta React ndani ya Laravel -->
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    <!-- html2pdf.js library for direct PDF generation and download (Local Offline Copy) -->
    <script src="{{ asset('html2pdf.bundle.min.js') }}"></script>
</head>
<body style="margin: 0; padding: 0; background-color: #000; overflow-x: hidden;">

    <!-- Hapa ndipo React inapoenda kumwaga muonekano mzima wa fomu na picha -->
    <div id="app"></div>

</body>
</html>