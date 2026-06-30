import './bootstrap';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

// Interceptor ya Axios kutambua base URL ya mradi kiotomatiki (Dynamic Base Path Detection)
axios.interceptors.request.use(config => {
    if (config.url && config.url.includes('/sales-management-system/public')) {
        const path = window.location.pathname;
        const publicIndex = path.indexOf('/public');
        const detectedBase = publicIndex !== -1 ? path.substring(0, publicIndex + 7) : '';
        config.url = config.url.replace('/sales-management-system/public', detectedBase);
    }
    return config;
}, error => {
    return Promise.reject(error);
});

const getCode39Pattern = (char) => {
    const alphabet = {
        '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
        '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
        '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
        'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
        'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
        'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
        'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
        'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
        'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
        '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100'
    };
    return alphabet[char.toUpperCase()] || '010010100';
};

const Barcode39 = ({ value, height = 35 }) => {
    if (!value) return null;
    let cleanValue = value.toString().toUpperCase().replace(/[^0-9A-Z\-\. ]/g, '');
    if (!cleanValue) cleanValue = 'LYETA';
    const fullString = `*${cleanValue}*`;
    
    const narrowWidth = 1.5;
    const wideWidth = 3.5;
    const gapWidth = 1.5;
    
    let x = 0;
    let rects = [];
    
    for (let i = 0; i < fullString.length; i++) {
        const char = fullString[i];
        const pattern = getCode39Pattern(char);
        if (!pattern) continue;
        
        for (let j = 0; j < 9; j++) {
            const isBlack = (j % 2 === 0);
            const isWide = (pattern[j] === '1');
            const width = isWide ? wideWidth : narrowWidth;
            
            if (isBlack) {
                rects.push(
                    <rect 
                        key={`${i}-${j}`} 
                        x={x} 
                        y={0} 
                        width={width} 
                        height={height} 
                        fill="#000000" 
                    />
                );
            }
            x += width;
        }
        x += gapWidth;
    }
    
    return (
        <svg 
            width={x} 
            height={height} 
            viewBox={`0 0 ${x} ${height}`} 
            xmlns="http://www.w3.org/2000/svg"
            style={{
                width: `${x}px`,
                height: `${height}px`,
                display: 'block'
            }}
        >
            {rects}
        </svg>
    );
};

const getThemeForDay = (lang = 'sw') => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    const themes = [
        // Day 1 (Sunday - Map to current theme: Luxury Dark Charcoal & Gold/Amber)
        {
            name: lang === 'sw' ? 'Mkaa wa Kifahari na Dhahabu' : 'Luxury Charcoal & Amber',
            sidebarBg: '#121212', sidebarHeader: '#1e1e1e', activeTabBg: '#d97706',
            hoverTabBg: '#b45309', textMain: '#ffffff', textMuted: '#fde68a', bodyBg: '#f9fafb'
        },
        // Day 2 (Monday - Royal Navy & Aquamarine)
        {
            name: lang === 'sw' ? 'Bluu ya Kifalme na Aquamarine' : 'Royal Navy & Aquamarine',
            sidebarBg: '#0b132b', sidebarHeader: '#1c2541', activeTabBg: '#5bc0be',
            hoverTabBg: '#3a506b', textMain: '#ffffff', textMuted: '#a5ffd6', bodyBg: '#f0f3f8'
        },
        // Day 3 (Tuesday - Velvet Forest Green & Gold)
        {
            name: lang === 'sw' ? 'Kijani ya Msitu na Dhahabu' : 'Forest Green & Gold',
            sidebarBg: '#142823', sidebarHeader: '#1b3b32', activeTabBg: '#d4af37',
            hoverTabBg: '#2d5a4e', textMain: '#ffffff', textMuted: '#f3e1dc', bodyBg: '#f4f7f5'
        },
        // Day 4 (Wednesday - Deep Burgundy & Platinum Silver)
        {
            name: lang === 'sw' ? 'Burgundy ya Kina na Platinamu' : 'Deep Burgundy & Platinum',
            sidebarBg: '#2c1619', sidebarHeader: '#3f1e22', activeTabBg: '#cbd5e1',
            hoverTabBg: '#5c2e33', textMain: '#ffffff', textMuted: '#f1f5f9', bodyBg: '#faf9f9'
        },
        // Day 5 (Thursday - Midnight Plum & Bright Gold)
        {
            name: lang === 'sw' ? 'Zambarau na Dhahabu' : 'Midnight Plum & Amber',
            sidebarBg: '#1e122b', sidebarHeader: '#2d1b3f', activeTabBg: '#f59e0b',
            hoverTabBg: '#4c2875', textMain: '#ffffff', textMuted: '#fef3c7', bodyBg: '#fdfbfd'
        },
        // Day 6 (Friday - Slate Teal & Bronze/Sand)
        {
            name: lang === 'sw' ? 'Teal ya Kisasa na Shaba' : 'Slate Teal & Bronze',
            sidebarBg: '#152a2c', sidebarHeader: '#1f3d40', activeTabBg: '#dd9a5f',
            hoverTabBg: '#2d565a', textMain: '#ffffff', textMuted: '#ffeedb', bodyBg: '#f2f6f6'
        },
        // Day 7 (Saturday - Obsidian Black & Neon Orange)
        {
            name: lang === 'sw' ? 'Nyeusi Tupu na Machungwa' : 'Obsidian Black & Neon Orange',
            sidebarBg: '#09090b', sidebarHeader: '#18181b', activeTabBg: '#ea580c',
            hoverTabBg: '#c2410c', textMain: '#ffffff', textMuted: '#ffedd5', bodyBg: '#fafafa'
        }
    ];
    
    return themes[day];
};

function MainApp() {
    const [page, setPage] = useState('login'); 
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState(''); 
    const [pdfDownloaded, setPdfDownloaded] = useState(false); 
    const [userId, setUserId] = useState('');
    const [cart, setCart] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [sellQty, setSellQty] = useState('1');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [posProductSearch, setPosProductSearch] = useState('');
    const [lang, setLang] = useState('sw'); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [showGooglePopup, setShowGooglePopup] = useState(false);
    const [googleStep, setGoogleStep] = useState(1);
    const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');
    const [googlePassword, setGooglePassword] = useState('');
    const [customers, setCustomers] = useState([]);
    const [downloadTimestamp, setDownloadTimestamp] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('+255');
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSaleReceipt, setLastSaleReceipt] = useState(null);
    const [userTwoFactorEnabled, setUserTwoFactorEnabled] = useState(false);
    const [is2faVerificationMode, setIs2faVerificationMode] = useState(false);
    const [twoFactorEmail, setTwoFactorEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [devCode, setDevCode] = useState(null);
    const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [refreshingLogs, setRefreshingLogs] = useState(false);
    const [printerType, setPrinterType] = useState(() => localStorage.getItem('printerType') || '80mm');
    const [labelProductId, setLabelProductId] = useState('');
    const [labelQty, setLabelQty] = useState('');
    const [barcodeLabelsToPrint, setBarcodeLabelsToPrint] = useState(null);
    const [barcodeLabelsToDownload, setBarcodeLabelsToDownload] = useState(null);
    const [activePrintType, setActivePrintType] = useState('receipt');

    const [viewAllSales, setViewAllSales] = useState(false);
    const [viewAllAudit, setViewAllAudit] = useState(false);

    const [inventory, setInventory] = useState([]);
    const [salesLog, setSalesLog] = useState([]);
    const [cashiersList, setCashiersList] = useState([]); 
    const [bgIndex, setBgIndex] = useState(1); 

    const [salesSummary, setSalesSummary] = useState({ today: 0, weekly: 0, monthly: 0 });
    const [stockReportList, setStockReportList] = useState([]);
    const [stockUpdatesList, setStockUpdatesList] = useState([]);
    const [slowSellingProducts, setSlowSellingProducts] = useState([]);

    const [newItemName, setNewItemName] = useState('');
    const [newItemBuy, setNewItemBuy] = useState('');
    const [newItemSell, setNewItemSell] = useState('');
    const [newItemStock, setNewItemStock] = useState('');

    const [excelFile, setExcelFile] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [productPage, setProductPage] = useState(1);
    const productsPerPage = 25; 

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; 

    const [auditLogs, setAuditLogs] = useState([
        { id: 1, action: "Admin viewed Cashier Activity Logs", time: "09:12 PM" },
        { id: 2, action: "Cashier Juma attempted login - Permitted", time: "09:15 PM" }
    ]);

    const dictionary = {
        sw: {
            dashboard: "Dashboard", pos: "POS Terminal (Uza)", cashier: "Cashier Management", sales: "Sales Reports",
            products: "Product Stock Control", progress_report: "Business Progress Report",
            settings: "Settings & Logins", logout: "Logout", syncText: "Lyeta Classic Enterprise POS v3.0",
            todaySales: "Today's Sales", weeklyGrowth: "Weekly Growth", monthlySales: "Monthly Sales",
            lowStockTitle: "Low Stock Alert", itemsLow: "Items Low", allHealthy: "All stock healthy",
            graphTitle: "Mwenendo wa Mauzo kwa Wiki (Siku 7 Zilizopita)",
            graphSub: "Grafu inayoonyesha kama mauzo yanapanda ama kushuka sokoni kulingana na tarehe husika zinazobadilika automatic",
            pastDays: "Siku zilizopita", currentDayMode: "Mzunguko wa Siku ya Leo",
            cycleText: "Siku ya", ofWeek: "ya Wiki", dateLabel: "Tarehe",
            salesTableTitle: "Ripoti ya Jumla ya Mauzo na Faida (Sales & Profit Report)",
            salesTableSub: "Mchanganuo wa Mauzo na Faida kwa Wiki (Siku 1 hadi Siku 7)",
            thCycle: "Siku ya Mzunguko", thTotal: "Jumla ya Mauzo (Total Amount)", thProfit: "Jumla ya Faida (Net Profit)",
            alertInstructionTitle: "Maelekezo ya Arifa",
            alertPdfText: "Nenda kwenye tab ya Business Progress Report sasa hivi kupakua faili la ripoti ya PDF kwa sababu wiki ya mzunguko imekamilika.",
            alertStockText1: "Ongeza stoki ya bidhaa ya [", alertStockText2: "] mara moja, kiasi kilichobaki stoo kiko chini ya kima salama (Zimebaki Pcs ",
            liveSalesTitle: "Live Sales Log (Siku ya Leo Tu)", viewAllBtn: "Angalia zote", closeLogBtn: "Funga kumbukumbu",
            cashierActivityTitle: "Cashier System Activities", noSalesToday: "Hakuna mauzo yaliyofanyika leo bado.",
            customers: "Wateja",
            customerName: "Jina la Mteja",
            phone: "Namba ya Simu",
            totalSpent: "Jumla ya Manunuzi",
            regDate: "Tarehe ya Usajili",
            historyBtn: "Historia",
            noCustomers: "Hakuna wateja waliorekodiwa bado.",
            customerHistoryTitle: "Historia ya Manunuzi ya",
            receiptNo: "Risiti Na",
            paymentMethod: "Njia ya Malipo",
            items: "Bidhaa",
            close: "Funga",
            print: "Chapa (Print)",
            walkIn: "Mteja wa Kawaida"
        },
        en: {
            dashboard: "Dashboard", pos: "POS Terminal (Sell)", cashier: "Cashier Management", sales: "Sales Reports",
            products: "Product Stock Control", progress_report: "Business Progress Report",
            settings: "Settings & Logins", logout: "Logout", syncText: "Lyeta Classic Enterprise POS v3.0",
            todaySales: "Today's Sales", weeklyGrowth: "Weekly Growth", monthlySales: "Monthly Sales",
            lowStockTitle: "Low Stock Alert", itemsLow: "Items Low", allHealthy: "All stock healthy",
            graphTitle: "Weekly Sales Performance (Past 7 Days)",
            graphSub: "Performance chart tracking sales growth trends based on automatic current dates",
            pastDays: "Previous days", currentDayMode: "Current Day Cycle",
            cycleText: "Day", ofWeek: "of the Week", dateLabel: "Date",
            salesTableTitle: "Sales & Profit Report Dashboard",
            salesTableSub: "Weekly Sales & Profit Analysis Breakdown (Day 1 to Day 7)",
            thCycle: "Cycle Day", thTotal: "Total Sales Amount", thProfit: "Net Profit (Estimated)",
            alertInstructionTitle: "Alert Instructions",
            alertPdfText: "Navigate to the Business Progress Report tab immediately to download the weekly PDF report archive.",
            alertStockText1: "Restock product [", alertStockText2: "] immediately, remaining inventory level is critically low (Only Pcs ",
            liveSalesTitle: "Live Sales Log (Today Only)", viewAllBtn: "View all logs", closeLogBtn: "Close log grid",
            cashierActivityTitle: "Cashier System Activities", noSalesToday: "No sales transactions have been recorded today.",
            customers: "Customer Directory",
            customerName: "Customer Name",
            phone: "Phone Number",
            totalSpent: "Total Spent",
            regDate: "Registration Date",
            historyBtn: "History",
            noCustomers: "No registered customers found.",
            customerHistoryTitle: "Purchase History for",
            receiptNo: "Receipt No",
            paymentMethod: "Payment Method",
            items: "Items",
            close: "Close",
            print: "Print",
            walkIn: "Walk-in Customer"
        }
    }[lang || 'sw'];

    const formatMoney = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '0';
        return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        }

        const role = localStorage.getItem('user_role');
        const name = localStorage.getItem('user_name');
        const id = localStorage.getItem('user_id');
        const tfa = localStorage.getItem('two_factor_enabled') === 'true';
        if (role && name) {
            setUserName(name);
            setUserRole(role);
            setUserId(id || '');
            setUserTwoFactorEnabled(tfa);
            setPage(role === 'admin' ? 'admin_dash' : 'cashier_dash');
        }

        fetchProducts();
        fetchBusinessReport();
        fetchCustomers();

        // INAVUTA DATA ZA CASHIERS KUTOKA DATABASE (HALISI)
        axios.get('/sales-management-system/public/api/users?role=cashier')
            .then(response => {
                if (Array.isArray(response.data)) {
                    setCashiersList(response.data);
                } else if (response.data && Array.isArray(response.data.data)) {
                    setCashiersList(response.data.data);
                } else {
                    setCashiersList([]);
                }
            })
            .catch(err => {
                console.error("API Error Cashiers:", err);
                setCashiersList([]); // Ikiwa na error, inaweka 0 badala ya dummy data
            });

        // Slideshow timer for 5 seconds rotation (10 slides)
        const slideInterval = setInterval(() => {
            setBgIndex((prev) => (prev === 10 ? 1 : prev + 1));
        }, 5000);

        // Dynamic background sync every 500 milliseconds for real-time updates
        const interval = setInterval(() => {
            fetchProducts();
            fetchBusinessReport();
        }, 500);

        return () => {
            clearInterval(slideInterval);
            clearInterval(interval);
        };
    }, [page]);

    useEffect(() => {
        if (activeTab === 'activity_logs' && userRole === 'admin') {
            fetchActivityLogs();
            const logInterval = setInterval(fetchActivityLogs, 2000);
            return () => clearInterval(logInterval);
        }
    }, [activeTab, userRole]);

    const fetchProducts = () => {
        axios.get('/sales-management-system/public/api/products')
            .then(response => {
                if (Array.isArray(response.data)) setInventory(response.data);
            })
            .catch(err => console.error("Imeshindwa kuvuta bidhaa:", err));
    };

    useEffect(() => {
        if (barcodeLabelsToDownload) {
            const element = document.getElementById('printable-barcodes-area');
            if (element) {
                const originalPosition = element.style.position;
                const originalLeft = element.style.left;
                const originalTop = element.style.top;
                
                element.style.position = 'relative';
                element.style.left = '0';
                element.style.top = '0';
                
                setTimeout(() => {
                    const opt = {
                        margin:       0.3,
                        filename:     `Barcode_Labels_${barcodeLabelsToDownload.productName.replace(/\s+/g, '_')}.pdf`,
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: true },
                        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    
                    html2pdf().set(opt).from(element).save().then(() => {
                        element.style.position = originalPosition;
                        element.style.left = originalLeft;
                        element.style.top = originalTop;
                        setBarcodeLabelsToDownload(null);
                    }).catch(err => {
                        console.error(err);
                        element.style.position = originalPosition;
                        element.style.left = originalLeft;
                        element.style.top = originalTop;
                        setBarcodeLabelsToDownload(null);
                    });
                }, 300);
            }
        }
    }, [barcodeLabelsToDownload]);

    const handleDownloadBarcodePDF = () => {
        if (typeof html2pdf === 'undefined') {
            alert(lang === 'sw' ? "Kuna hitilafu: Maktaba ya PDF haijapakia. Tafadhali tumia kitufe cha 'Chapa (Print)'." : "Error: PDF library not loaded. Please use the 'Print Labels' button instead.");
            return;
        }
        if (!labelProductId) {
            alert(lang === 'sw' ? 'Tafadhali chagua bidhaa kwanza!' : 'Please select a product first!');
            return;
        }
        const qtyNum = parseInt(labelQty);
        if (!labelQty || isNaN(qtyNum) || qtyNum <= 0) {
            alert(lang === 'sw' ? 'Tafadhali weka idadi ya vibandiko!' : 'Please enter a valid label quantity!');
            return;
        }
        const product = safeInventory.find(p => p.id === parseInt(labelProductId));
        if (!product) return;
        
        const barcodeVal = product.barcode || `LYETA${product.id}`;
        
        logActionFrontend("Downloaded PDF Barcode Labels for " + product.product_name + " (Qty: " + qtyNum + ")");
        
        setBarcodeLabelsToDownload({
            productName: product.product_name,
            barcode: barcodeVal,
            qty: qtyNum
        });
    };

    const handlePrintBarcodeBrowser = () => {
        if (!labelProductId) {
            alert(lang === 'sw' ? 'Tafadhali chagua bidhaa kwanza!' : 'Please select a product first!');
            return;
        }
        const qtyNum = parseInt(labelQty);
        if (!labelQty || isNaN(qtyNum) || qtyNum <= 0) {
            alert(lang === 'sw' ? 'Tafadhali weka idadi ya vibandiko!' : 'Please enter a valid label quantity!');
            return;
        }
        const product = safeInventory.find(p => p.id === parseInt(labelProductId));
        if (!product) return;
        
        const barcodeVal = product.barcode || `LYETA${product.id}`;
        
        logActionFrontend("Printed Barcode Labels for " + product.product_name + " (Qty: " + qtyNum + ")");

        setActivePrintType('barcodes');
        setBarcodeLabelsToPrint({
            productName: product.product_name,
            barcode: barcodeVal,
            qty: qtyNum
        });
        
        setTimeout(() => {
            window.print();
            setBarcodeLabelsToPrint(null);
            setActivePrintType('receipt');
        }, 300);
    };

    const handleSendReceiptWhatsApp = (receipt) => {
        if (!receipt) return;
        
        let phone = '';
        if (receipt.customer && receipt.customer.phone) {
            phone = receipt.customer.phone;
        }
        
        // Kama mteja hana namba iliyosajiliwa, muulize cashier
        if (!phone) {
            phone = prompt(
                lang === 'sw' 
                    ? "Mteja hana namba iliyosajiliwa. Weka namba ya WhatsApp ya mteja (mfano: 255712345678):" 
                    : "Customer has no registered number. Enter customer's WhatsApp phone number (e.g. 255712345678):"
            );
            if (phone === null) return; // Mtumiaji amekataa
        }
        
        // Safisha namba kuondoa alama zote isipokuwa tarakimu
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '255' + cleanPhone.substring(1);
        }
        
        if (!cleanPhone || cleanPhone.length < 9) {
            alert(lang === 'sw' ? "Namba ya simu sio sahihi!" : "Invalid phone number!");
            return;
        }
        
        let msg = `*LYETA CLASSIC*\n`;
        msg += `Magomeni Street\n`;
        msg += `Tel: 0712345678\n`;
        msg += `------------------------------------------\n`;
        msg += `*Receipt No:* #${receipt.sale_id}\n`;
        msg += `*Date:* ${receipt.date}\n`;
        msg += `*Cashier:* ${receipt.cashier_name}\n`;
        if (receipt.customer) {
            msg += `*Customer:* ${receipt.customer.name} (${receipt.customer.phone || ''})\n`;
        } else {
            msg += `*Customer:* Mteja wa Kawaida / Walk-in\n`;
        }
        msg += `------------------------------------------\n`;
        msg += `*Item* | *Qty* | *Price* | *Total*\n`;
        
        receipt.items.forEach(item => {
            msg += `${item.name} | ${item.quantity} | TSH ${formatMoney(item.price)} | TSH ${formatMoney(item.total)}\n`;
        });
        
        msg += `------------------------------------------\n`;
        
        const totalAmount = receipt.total;
        const netAmount = Math.round(totalAmount / 1.18);
        const vatAmount = totalAmount - netAmount;
        
        msg += `*Net Amount (Excl. VAT):* TSH ${formatMoney(netAmount)}\n`;
        msg += `*VAT (18% Inclusive):* TSH ${formatMoney(vatAmount)}\n`;
        msg += `*TOTAL (Incl. VAT):* *TSH ${formatMoney(totalAmount)}*\n`;
        msg += `*Payment Method:* ${receipt.payment_method.toUpperCase()}\n`;
        msg += `------------------------------------------\n`;
        msg += `Thank you for shopping with us!\n`;
        msg += `Welcome again`;
        
        const encodedMsg = encodeURIComponent(msg);
        const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
        window.open(url, '_blank');
        
        logActionFrontend(`Sent Digital Receipt #${receipt.sale_id} to WhatsApp number ${cleanPhone}`);
    };

    const fetchBusinessReport = () => {
        axios.get('/sales-management-system/public/api/sales')
            .then(response => {
                if (response.data && response.data.status === 'success') {
                    setSalesSummary(response.data.sales_summary);
                    setStockReportList(response.data.stock_report);
                    if (Array.isArray(response.data.stock_updates)) {
                        setStockUpdatesList(response.data.stock_updates);
                    }
                    if (Array.isArray(response.data.sales_log)) {
                        setSalesLog(response.data.sales_log);
                    }
                    if (Array.isArray(response.data.top_selling)) {
                        setTopSellingProducts(response.data.top_selling);
                    }
                    if (Array.isArray(response.data.slow_selling)) {
                        setSlowSellingProducts(response.data.slow_selling);
                    }
                } else if (Array.isArray(response.data)) {
                    setSalesLog(response.data);
                }
            })
            .catch(err => console.error("Imeshindwa kuvuta ripoti ya biashara:", err));
    };

    const fetchCustomers = () => {
        axios.get('/sales-management-system/public/api/customers')
            .then(response => {
                if (Array.isArray(response.data)) setCustomers(response.data);
            })
            .catch(err => console.error("Imeshindwa kuvuta wateja:", err));
    };

    const fetchActivityLogs = () => {
        setRefreshingLogs(true);
        axios.get('/sales-management-system/public/api/activity-logs')
            .then(response => {
                if (response.data && response.data.status === 'success') {
                    setActivityLogs(response.data.activity_logs);
                }
            })
            .catch(err => console.error("Imeshindwa kuvuta kumbukumbu za mfumo:", err))
            .finally(() => {
                setRefreshingLogs(false);
            });
    };

    const logActionFrontend = (action) => {
        axios.post('/sales-management-system/public/api/log-activity', {
            user_id: userId ? parseInt(userId) : null,
            cashier_name: userName || 'System',
            action: action
        }).catch(err => console.error("Failed to log frontend action:", err));
    };

    const fetchCustomerHistory = (id) => {
        axios.get(`/sales-management-system/public/api/customers/${id}/history`)
            .then(response => {
                if (response.data && response.data.status === 'success') {
                    setSelectedCustomerHistory(response.data);
                    setShowHistoryModal(true);
                }
            })
            .catch(err => {
                console.error("Failed to fetch customer history:", err);
                alert(lang === 'sw' ? "Imeshindwa kuvuta historia ya mteja!" : "Failed to fetch customer history!");
            });
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const buy = parseFloat(newItemBuy);
        const sell = parseFloat(newItemSell);
        if (buy >= sell) {
            alert("Bei ya Kuuzia lazima iwe kubwa kuliko Bei ya Kununulia (Capital)!");
            return;
        }

        const autoGeneratedBarcode = "BRC" + Date.now();

        try {
            const response = await axios.post('/sales-management-system/public/api/products', {
                name: newItemName, buying_price: parseFloat(newItemBuy), selling_price: parseFloat(newItemSell),
                stock: parseInt(newItemStock), barcode: autoGeneratedBarcode 
            });

            if (response.data && (response.data.status === 'success' || response.status === 200)) {
                alert(`Hongera Eltony! Bidhaa imerekodiwa na kupewa Auto-Barcode: ${autoGeneratedBarcode}`);
                fetchProducts(); fetchBusinessReport();
                setNewItemName(''); setNewItemBuy(''); setNewItemSell(''); setNewItemStock('');
            }
        } catch (err) {
            console.error(err);
            alert(`Kodi imetengeneza Auto-Barcode ${autoGeneratedBarcode} salama!`);
            fetchProducts(); fetchBusinessReport();
        }
    };

    const downloadExcelTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Product Name,Buying Price,Selling Price,Stock\nPanadol,1500,2000,100\nSoap,800,1200,50";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sales_system_products_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExcelImport = async (e) => {
        e.preventDefault();
        if (!excelFile) { alert("Tafadhali chagua file la Excel/CSV kutoka kwenye PC yako kwanza!"); return; }
        const formData = new FormData();
        formData.append('file', excelFile);

        try {
            const response = await axios.post('/sales-management-system/public/api/products/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data && response.data.status === 'success') {
                alert("Hongera Eltony! Mzigo wote wa Excel/CSV bila kikomo umeingizwa kwenye Database.");
                fetchProducts(); fetchBusinessReport(); setExcelFile(null);
            } else {
                alert("Hitilafu: " + (response.data.message || "Imeshindwa kuingiza data."));
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || "Imeshindwa kuingiza data ya Excel. Tafadhali kagua faili lako!";
            alert("Hitilafu ya Import: " + errMsg);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm("Je, una uhakika unataka kufuta bidhaa hii kabisa kwenye Database?")) return;
        try {
            await axios.delete(`/sales-management-system/public/api/products/${id}`);
            alert("Bidhaa imefutwa kwa mafanikio.");
            fetchProducts(); fetchBusinessReport();
        } catch (err) {
            console.error(err);
            if (Array.isArray(inventory)) setInventory(inventory.filter(p => p.id !== id));
        }
    };

    const handleUpdateStock = async (id, currentQty) => {
        const addedQty = prompt("Weka idadi ya stoki mpya unayotaka kuongeza:");
        if (!addedQty || isNaN(addedQty)) return;

        const newQty = parseInt(currentQty) + parseInt(addedQty);
        try {
            await axios.post(`/sales-management-system/public/api/products/${id}/update-stock`, { quantity: newQty });
            alert("Stoki imesasishwa moja kwa moja kwenye DB!");
            fetchProducts(); fetchBusinessReport();
        } catch (err) {
            console.error(err);
            if (Array.isArray(inventory)) setInventory(inventory.map(p => p.id === id ? { ...p, quantity: newQty } : p));
        }
    };

    const handleAddToCart = () => {
        if (!selectedProductId) { alert("Tafadhali chagua bidhaa kwanza!"); return; }
        const prod = safeInventory.find(p => p.id === parseInt(selectedProductId));
        if (!prod) return;

        if (prod.quantity <= 0) {
            alert("Bidhaa hii haipo kwenye stoki kwa sasa!");
            return;
        }

        const qty = parseInt(sellQty);
        if (isNaN(qty) || qty <= 0) { alert("Weka idadi sahihi ya bidhaa!"); return; }

        const existingItem = cart.find(item => item.product_id === prod.id);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;

        if (currentQtyInCart + qty > prod.quantity) {
            alert(`Stoki haitoshi! Kuna Pcs ${prod.quantity} tu na umeweka Pcs ${currentQtyInCart + qty} kwenye gari la manunuzi.`);
            return;
        }

        if (existingItem) {
            setCart(cart.map(item => item.product_id === prod.id ? { ...item, quantity: item.quantity + qty } : item));
        } else {
            setCart([...cart, {
                product_id: prod.id,
                product_name: prod.product_name,
                quantity: qty,
                selling_price: parseFloat(prod.selling_price),
                max_stock: prod.quantity
            }]);
        }
        setSellQty('1');
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) { alert("Tafadhali ongeza bidhaa kwenye gari la manunuzi!"); return; }
        
        const loggedInUserId = userId || localStorage.getItem('user_id');
        if (!loggedInUserId) { alert("Hitilafu ya mtumiaji! Tafadhali log out na log in tena."); return; }

        const payload = {
            user_id: parseInt(loggedInUserId),
            customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
            payment_method: paymentMethod,
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await axios.post('/sales-management-system/public/api/sales', payload);
            if (response.data && response.data.status === 'success') {
                // Hifadhi taarifa za risiti kwa ajili ya printing popup
                const receiptDetails = {
                    sale_id: response.data.sale_id,
                    cashier_name: userName || 'Cashier',
                    customer: response.data.customer, // inatoka backend (name na phone)
                    items: cart.map(item => ({
                        name: item.product_name || item.name,
                        quantity: item.quantity,
                        price: item.selling_price || item.price,
                        total: item.quantity * (item.selling_price || item.price)
                    })),
                    total: response.data.total || cart.reduce((acc, curr) => acc + (curr.quantity * (curr.selling_price || curr.price)), 0),
                    payment_method: paymentMethod,
                    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
                };

                setLastSaleReceipt(receiptDetails);
                setShowReceiptModal(true);

                // Safisha gari na mteja aliyechaguliwa
                setCart([]);
                setSelectedCustomerId('');
                fetchProducts();
                fetchBusinessReport();
                fetchCustomers();
            }
        } catch (err) {
            console.error(err);
            alert("Hitilafu wakati wa kukamilisha mauzo: " + (err.response?.data?.message || err.message));
        }
    };

    // ACTION YA KUBADILI STATUS YA CASHIER (INAWASILIANA NA LARAVEL)
    const toggleCashierStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        try {
            await axios.post(`/sales-management-system/public/api/users/${id}/toggle-status`, { status: newStatus });
            if (Array.isArray(cashiersList)) setCashiersList(cashiersList.map(c => c.id === id ? { ...c, status: newStatus } : c));
            alert(`Success! Cashier status updated to: ${newStatus.toUpperCase()}`);
        } catch (err) {
            console.error(err);
            alert("Imeshindwa kuwasiliana na database, lakini status imebadilika kwa muda kwenye kioo.");
            if (Array.isArray(cashiersList)) setCashiersList(cashiersList.map(c => c.id === id ? { ...c, status: newStatus } : c));
        }
    };

    const changeCashierPasswordPrompt = async (id) => {
        const newPass = prompt("Weka password mpya kwa cashier huyu:");
        if (!newPass) return;
        if (newPass.length < 3) { alert("Nenosiri lazima liwe na herufi 3 au zaidi!"); return; }
        try {
            const response = await axios.post(`/sales-management-system/public/api/users/${id}/change-password`, { password: newPass });
            if (response.data && response.data.status === 'success') {
                alert("Hongera! Nenosiri la cashier limesasishwa.");
                axios.get('/sales-management-system/public/api/users?role=cashier')
                    .then(res => {
                        if (Array.isArray(res.data)) setCashiersList(res.data);
                        else if (res.data && Array.isArray(res.data.data)) setCashiersList(res.data.data);
                    });
            }
        } catch (err) {
            console.error(err);
            alert("Imeshindwa kusasisha password ya cashier!");
        }
    };

    const deleteCashier = async (id, name) => {
        const confirmDelete = confirm(lang === 'sw' 
            ? `Je, una uhakika unataka kumfuta cashier ${name} kabisa?` 
            : `Are you sure you want to delete cashier ${name} permanently?`);
        if (!confirmDelete) return;
        try {
            const response = await axios.delete(`/sales-management-system/public/api/users/${id}`);
            if (response.data && response.data.status === 'success') {
                alert(lang === 'sw' ? "Cashier amefutwa kikamilifu!" : "Cashier has been successfully deleted!");
                if (Array.isArray(cashiersList)) setCashiersList(cashiersList.filter(c => c.id !== id));
            }
        } catch (err) {
            console.error(err);
            alert(lang === 'sw' ? "Imeshindwa kumfuta cashier!" : "Failed to delete cashier!");
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setError(lang === 'sw' ? 'Barua pepe lazima iishie na @gmail.com!' : 'Email must end with @gmail.com!');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/sales-management-system/public/api/login', { email: email, password: password });
            if (response.data && response.data.status === 'success') {
                localStorage.setItem('token', response.data.access_token);
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token;
                localStorage.setItem('user_role', response.data.user.role);
                localStorage.setItem('user_name', response.data.user.name);
                localStorage.setItem('user_id', response.data.user.id);
                localStorage.setItem('two_factor_enabled', response.data.user.two_factor_enabled ? 'true' : 'false');
                
                setUserName(response.data.user.name);
                setUserRole(response.data.user.role);
                setUserId(response.data.user.id);
                setUserTwoFactorEnabled(response.data.user.two_factor_enabled);
                
                setActiveTab('dashboard');
                setPage(response.data.user.role === 'admin' ? 'admin_dash' : 'cashier_dash');
            } else if (response.data && response.data.status === '2fa_required') {
                setTwoFactorEmail(response.data.email);
                setDevCode(response.data.dev_code || null);
                setIs2faVerificationMode(true);
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Invalid Email or Password!');
            }
        } finally {
            setLoading(false);
        }
    };

    const [backingUp, setBackingUp] = useState(false);

    const handleDownloadBackup = () => {
        setBackingUp(true);
        axios.post('/sales-management-system/public/api/backup', {}, { responseType: 'blob' })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `lyeta_classic_backup_${new Date().toISOString().slice(0,10)}_${new Date().toTimeString().slice(0,8).replace(/:/g,'_')}.sql`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                alert(lang === 'sw' ? 'Backup ya mfumo imekamilika na kupakuliwa kikamilifu!' : 'System backup completed and downloaded successfully!');
            })
            .catch(err => {
                console.error(err);
                alert(lang === 'sw' ? 'Mchakato wa backup umefeli!' : 'Database backup failed!');
            })
            .finally(() => setBackingUp(false));
    };

    const handleToggle2FA = (e) => {
        const enabled = e.target.checked;
        axios.post('/sales-management-system/public/api/toggle-2fa', { enabled: enabled })
            .then(response => {
                if (response.data && response.data.status === 'success') {
                    alert(response.data.message);
                    localStorage.setItem('two_factor_enabled', enabled ? 'true' : 'false');
                    setUserTwoFactorEnabled(enabled);
                }
            })
            .catch(err => {
                console.error(err);
                alert(lang === 'sw' ? 'Imeshindwa kusasisha ulinzi wa 2FA!' : 'Failed to update 2FA status!');
            });
    };

    const handle2faSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/sales-management-system/public/api/verify-2fa', {
                email: twoFactorEmail,
                code: verificationCode
            });
            
            if (response.data && response.data.status === 'success') {
                localStorage.setItem('token', response.data.access_token);
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token;
                localStorage.setItem('user_role', response.data.user.role);
                localStorage.setItem('user_name', response.data.user.name);
                localStorage.setItem('user_id', response.data.user.id);
                localStorage.setItem('two_factor_enabled', response.data.user.two_factor_enabled ? 'true' : 'false');
                
                setUserName(response.data.user.name);
                setUserRole(response.data.user.role);
                setUserId(response.data.user.id);
                setUserTwoFactorEnabled(response.data.user.two_factor_enabled);
                
                setIs2faVerificationMode(false);
                setVerificationCode('');
                setDevCode(null);
                
                setActiveTab('dashboard');
                setPage(response.data.user.role === 'admin' ? 'admin_dash' : 'cashier_dash');
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError(lang === 'sw' ? 'Msimbo uliyoweka si sahihi!' : 'Invalid verification code!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!signupEmail.toLowerCase().endsWith('@gmail.com')) {
            setError(lang === 'sw' ? 'Barua pepe lazima iishie na @gmail.com!' : 'Email must end with @gmail.com!');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/sales-management-system/public/api/register', {
                name: signupName,
                email: signupEmail,
                password: signupPassword
            });
            if (response.data && response.data.status === 'success') {
                alert(response.data.message);
                setIsSignUpMode(false);
                setSignupName('');
                setSignupEmail('');
                setSignupPassword('');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGooglePassword('');
        setLoading(true);
        try {
            const response = await axios.get('/sales-management-system/public/api/device-email');
            if (response.data && response.data.email) {
                setSelectedGoogleEmail(response.data.email);
                setShowGooglePopup(true);
                setGoogleStep(1);
            } else {
                setError(lang === 'sw' ? 'Mchakato wa kutambua barua pepe ya kifaa umeshindwa!' : 'Failed to detect device email!');
            }
        } catch (err) {
            setError(lang === 'sw' ? 'Mchakato wa kutambua barua pepe ya kifaa umeshindwa!' : 'Failed to detect device email!');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logActionFrontend("Logged out of the system");
        delete axios.defaults.headers.common['Authorization'];
        localStorage.clear();
        setPage('login');
        setEmail('');
        setPassword('');
        setUserId('');
        setUserName('');
        setUserRole('');
        setCart([]);
    };

    const purpleTheme = getThemeForDay(lang);

    if (page === 'login') {
        const basePath = window.location.pathname.endsWith('/') 
            ? window.location.pathname 
            : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

        const bgImages = [
            "login-bg-1.jpg",
            "login-bg-2.jpg",
            "login-bg-3.jpg",
            "login-bg-4.jpg",
            "login-bg-5.jpg",
            "login-bg-6.jpg",
            "login-bg-7.jpg",
            "login-bg-8.jpg",
            "login-bg-9.jpg",
            "login-bg-10.jpg"
        ];

        return (
            <div style={{ 
                backgroundImage: `url('${basePath}${bgImages[bgIndex - 1]}')`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                backgroundRepeat: 'no-repeat',
                height: '100vh', 
                width: '100vw', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'sans-serif', 
                transition: 'background-image 0.8s ease-in-out',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Dark overlay for contrast */}
                <div style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                    zIndex: 1 
                }} />

                {/* Floating Sign In Card Centered */}
                <div style={{ 
                    zIndex: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    backdropFilter: 'blur(24px)', 
                    padding: '30px 35px', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    width: '100%',
                    maxWidth: '420px',
                    color: '#fff',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    boxSizing: 'border-box'
                }}>
                    <h2 style={{ fontSize: '26px', margin: '0 0 25px 0', fontWeight: 'bold', textAlign: 'center', color: '#ffffff', letterSpacing: '-0.5px' }}>LYETA CLASSIC</h2>
                    
                    {error && (
                        <div style={{ 
                            backgroundColor: '#e53e3e', 
                            color: '#fff', 
                            padding: '12px', 
                            borderRadius: '6px', 
                            marginBottom: '20px', 
                            textAlign: 'center', 
                            fontSize: '14px', 
                            fontWeight: 'bold' 
                        }}>
                            {error}
                        </div>
                    )}
                    
                    {is2faVerificationMode ? (
                        /* 2FA VERIFICATION FORM */
                        <form onSubmit={handle2faSubmit}>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '20px', textAlign: 'center' }}>
                                {lang === 'sw' 
                                    ? 'Nambari ya ulinzi imetumwa kwenye barua pepe yako (Gmail). Tafadhali weka nambari hiyo hapa chini ili kuthibitisha.' 
                                    : 'A verification code has been sent to your email. Please enter the code below to verify.'}
                            </p>
                            
                            {devCode && (
                                <div style={{ backgroundColor: '#2f855a', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                                    {lang === 'sw' ? `Majaribio (Dev Mode): Code yako ni: ${devCode}` : `Dev Mode: Your 2FA code is: ${devCode}`}
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                                    {lang === 'sw' ? 'Msimbo wa Uthibitisho (6 Digits)' : 'Verification Code'}
                                </label>
                                <input 
                                    type="text" 
                                    value={verificationCode} 
                                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))} 
                                    maxLength={6}
                                    placeholder="123456"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#1a202c', fontSize: '18px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '8px', boxSizing: 'border-box' }} 
                                    required 
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    backgroundColor: '#0f172a', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }} 
                                disabled={loading}
                            >
                                {loading ? 'Checking...' : (lang === 'sw' ? 'Thibitisha' : 'Verify & Sign in')}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIs2faVerificationMode(false);
                                    setVerificationCode('');
                                    setDevCode(null);
                                    setError('');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '10px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}
                            >
                                {lang === 'sw' ? 'Ghairi / Rudi Login' : 'Cancel / Back to Login'}
                            </button>
                        </form>
                    ) : !isSignUpMode ? (
                        /* LOGIN FORM */
                        <form onSubmit={handleLoginSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="username@gmail.com"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#1a202c', fontSize: '15px', boxSizing: 'border-box' }} 
                                    required 
                                />
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Password</label>
                                <input 
                                    type="text" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="Password"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#1a202c', fontSize: '15px', boxSizing: 'border-box', WebkitTextSecurity: 'disc', textSecurity: 'disc' }} 
                                    required 
                                    autoComplete="off"
                                />
                            </div>

                            {/* Remember me & Forgot Password Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', fontSize: '13px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.9)' }}>
                                    <input type="checkbox" style={{ cursor: 'pointer' }} />
                                    {lang === 'sw' ? 'Nikumbuke kwa siku 30' : 'Remember for 30 days'}
                                </label>
                                <span 
                                    onClick={() => {
                                        alert(lang === 'sw' 
                                            ? "Tafadhali wasiliana na Bosi Eltony (Admin) ili kurejesha nenosiri lako." 
                                            : "Please contact Boss Eltony (Admin) to reset your password.");
                                    }}
                                    style={{ color: 'rgba(255, 255, 255, 0.85)', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    {lang === 'sw' ? 'Umesahau password?' : 'Forgot password'}
                                </span>
                            </div>
                            
                            <button 
                                type="submit" 
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    backgroundColor: '#0f172a', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    transition: 'background-color 0.2s',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }} 
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Sign in'}
                            </button>

                            {/* Continue with Google button */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '15px',
                                    backgroundColor: '#ffffff',
                                    color: '#1f2937',
                                    border: '1px solid #cbd5e0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {lang === 'sw' ? 'Ingia na Google' : 'Sign in with Google'}
                            </button>

                            {/* Don't have an account? Sign up */}
                            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                                    {lang === 'sw' ? 'Je, huna akaunti? ' : "Don't have an account? "}
                                    <strong 
                                        onClick={() => { setError(''); setIsSignUpMode(true); }} 
                                        style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                        {lang === 'sw' ? 'Sajili sasa' : 'Sign up'}
                                    </strong>
                                </span>
                                
                                <select 
                                    value={lang} 
                                    onChange={(e) => setLang(e.target.value)} 
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.3)', fontSize: '13px', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer' }}
                                >
                                    <option value="sw" style={{ backgroundColor: '#231e5c' }}>Kiswahili</option>
                                    <option value="en" style={{ backgroundColor: '#231e5c' }}>English</option>
                                </select>
                            </div>
                        </form>
                    ) : (
                        /* SIGN UP / REGISTER FORM */
                        <form onSubmit={handleSignupSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    value={signupName} 
                                    onChange={e => setSignupName(e.target.value)} 
                                    placeholder="e.g. Juma Kassim"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#1a202c', fontSize: '15px', boxSizing: 'border-box' }} 
                                    required 
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    value={signupEmail} 
                                    onChange={e => setSignupEmail(e.target.value)} 
                                    placeholder="username@gmail.com"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#1a202c', fontSize: '15px', boxSizing: 'border-box' }} 
                                    required 
                                />
                            </div>
                            
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>Password</label>
                                <input 
                                    type="text" 
                                    value={signupPassword} 
                                    onChange={e => setSignupPassword(e.target.value)} 
                                    placeholder="Password"
                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', color: '#1a202c', fontSize: '15px', boxSizing: 'border-box', WebkitTextSecurity: 'disc', textSecurity: 'disc' }} 
                                    required 
                                    autoComplete="off"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    backgroundColor: '#0f172a', 
                                    color: '#ffffff', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    transition: 'background-color 0.2s',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }} 
                                disabled={loading}
                            >
                                {loading ? 'Registering...' : 'Sign up'}
                            </button>

                            {/* Already have an account? Sign in */}
                            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                                    {lang === 'sw' ? 'Tayari una akaunti? ' : 'Already have an account? '}
                                    <strong 
                                        onClick={() => { setError(''); setIsSignUpMode(false); }} 
                                        style={{ color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                        {lang === 'sw' ? 'Ingia hapa' : 'Sign in'}
                                    </strong>
                                </span>

                                <select 
                                    value={lang} 
                                    onChange={(e) => setLang(e.target.value)} 
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.3)', fontSize: '13px', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer' }}
                                >
                                    <option value="sw" style={{ backgroundColor: '#231e5c' }}>Kiswahili</option>
                                    <option value="en" style={{ backgroundColor: '#231e5c' }}>English</option>
                                </select>
                            </div>
                        </form>
                    )}
                </div>
                {showGooglePopup && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        zIndex: 999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '380px',
                            padding: '40px 32px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            boxSizing: 'border-box',
                            color: '#202124',
                            textAlign: 'left'
                        }}>
                            {/* Google Logo */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                <svg width="74" height="24" viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.24 11.2h7.82c-.1 1.48-.78 2.76-2.02 3.59-1.28.84-2.88 1.34-4.8 1.34-4.29 0-7.82-3.1-7.82-7.46s3.53-7.46 7.82-7.46c2.31 0 4.15.82 5.51 2.14l2.84-2.84C17.9 1.4 14.62 0 10.24 0c-5.83 0-10.24 4.54-10.24 10.45 0 5.92 4.41 10.46 10.24 10.46 5.58 0 9.77-3.9 9.77-9.84V11.2H9.24z" fill="#4285F4"/>
                                    <path d="M26.45 2.1c-3.73 0-6.75 3.02-6.75 6.77s3.02 6.78 6.75 6.78 6.75-3.02 6.75-6.78-3.02-6.77-6.75-6.77zm0 10.66c-2.04 0-3.69-1.68-3.69-3.89s1.65-3.88 3.69-3.88 3.69 1.67 3.69 3.88-1.65 3.89-3.69 3.89z" fill="#EA4335"/>
                                    <path d="M41.45 2.1c-3.73 0-6.75 3.02-6.75 6.77s3.02 6.78 6.75 6.78 6.75-3.02 6.75-6.78-3.02-6.77-6.75-6.77zm0 10.66c-2.04 0-3.69-1.68-3.69-3.89s1.65-3.88 3.69-3.88 3.69 1.67 3.69 3.88-1.65 3.89-3.69 3.89z" fill="#FBBC05"/>
                                    <path d="M55.85 2.1c-3.56 0-6.47 2.94-6.47 6.78 0 3.79 2.87 6.77 6.47 6.77 1.5 0 2.76-.58 3.53-1.39v1.1c0 2.59-1.39 3.96-3.62 3.96-1.82 0-2.95-1.31-3.36-2.4l-2.65 1.1c.77 1.85 2.81 4.14 6.01 4.14 3.49 0 6.44-2.06 6.44-7.05V2.6h-2.95v1.2c-.77-.85-2.03-1.7-3.4-1.7zm.25 10.66c-2.04 0-3.59-1.73-3.59-3.9 0-2.19 1.55-3.87 3.59-3.87 2.01 0 3.56 1.7 3.56 3.9 0 2.16-1.55 3.87-3.56 3.87z" fill="#4285F4"/>
                                    <path d="M64.75.5h3.08v20h-3.08V.5z" fill="#34A853"/>
                                    <path d="M74 8.7c0-3.4-2.47-6.6-6.16-6.6-3.65 0-6.64 2.94-6.64 6.77s3 6.78 6.64 6.78c2.97 0 4.67-1.81 5.37-2.85l-2.2-1.47c-.7.99-1.63 1.64-3.17 1.64-1.8 0-3.12-.99-3.63-2.53L74 8.7zm-9.74.2c0-2.1 1.61-3.49 3.08-3.49.99 0 1.91.49 2.19 1.18L64.26 8.9z" fill="#EA4335"/>
                                </svg>
                            </div>

                            {/* Title */}
                            <h3 style={{ fontSize: '24px', fontWeight: '400', margin: '0 0 8px 0', textAlign: 'center', color: '#202124' }}>
                                {lang === 'sw' ? 'Thibitisha ni wewe' : "Verify it's you"}
                            </h3>
                            <p style={{ fontSize: '15px', color: '#5f6368', margin: '0 0 24px 0', textAlign: 'center' }}>
                                {lang === 'sw' ? 'Ili uendelee kwenye Sales Management System' : "To continue, first verify it's you"}
                            </p>

                            {/* Pre-detected Account Box */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderRadius: '100px',
                                border: '1px solid #dadce0',
                                margin: '0 auto 24px auto',
                                width: 'fit-content',
                                maxWidth: '100%',
                                backgroundColor: '#ffffff'
                            }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#1a73e8',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    marginRight: '8px',
                                    flexShrink: 0
                                }}>
                                    {selectedGoogleEmail ? selectedGoogleEmail.charAt(0).toUpperCase() : 'G'}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#3c4043', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {selectedGoogleEmail}
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setError('');
                                setLoading(true);
                                try {
                                    const response = await axios.post('/sales-management-system/public/api/google-login', {
                                        email: selectedGoogleEmail,
                                        name: selectedGoogleEmail.split('@')[0],
                                        password: googlePassword
                                    });
                                    if (response.data && response.data.status === 'success') {
                                        localStorage.setItem('token', response.data.access_token);
                                        axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token;
                                        localStorage.setItem('user_role', response.data.user.role);
                                        localStorage.setItem('user_name', response.data.user.name);
                                        localStorage.setItem('user_id', response.data.user.id);
                                        setUserName(response.data.user.name);
                                        setUserRole(response.data.user.role);
                                        setUserId(response.data.user.id);
                                        setShowGooglePopup(false);
                                        setGooglePassword('');
                                        setActiveTab('dashboard');
                                        setPage(response.data.user.role === 'admin' ? 'admin_dash' : 'cashier_dash');
                                    }
                                } catch (err) {
                                    if (err.response && err.response.data && err.response.data.message) {
                                        setError(err.response.data.message);
                                    } else {
                                        setError(lang === 'sw' ? 'Mchakato wa Google umeshindwa!' : 'Google verification failed!');
                                    }
                                } finally {
                                    setLoading(false);
                                }
                            }}>
                                {/* Password input */}
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <input
                                        type="password"
                                        placeholder={lang === 'sw' ? 'Weka nenosiri' : 'Enter password'}
                                        value={googlePassword}
                                        onChange={(e) => setGooglePassword(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            borderRadius: '4px',
                                            border: '1px solid #dadce0',
                                            fontSize: '16px',
                                            color: '#202124',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                        onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div style={{ color: '#d93025', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {/* Buttons */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowGooglePopup(false); setError(''); setGooglePassword(''); }}
                                        style={{
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            color: '#1a73e8',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            padding: '9px 12px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            border: 'none',
                                            backgroundColor: loading ? '#ccc' : '#1a73e8',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: loading ? 'default' : 'pointer',
                                            padding: '10px 24px',
                                            borderRadius: '4px',
                                            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                                        }}
                                    >
                                        {loading ? (lang === 'sw' ? 'Inathibitisha...' : 'Verifying...') : (lang === 'sw' ? 'Ijayo' : 'Next')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const adminMenus = [
        { id: 'dashboard', label: dictionary.dashboard },
        { id: 'cashier', label: dictionary.cashier },
        { id: 'sales', label: dictionary.sales },
        { id: 'products', label: dictionary.products },
        { id: 'customers', label: dictionary.customers },
        { id: 'progress_report', label: dictionary.progress_report }, 
        { id: 'activity_logs', label: lang === 'sw' ? 'Marekodi ya Mfumo (Logs)' : 'Activity Logs' },
        { id: 'settings', label: dictionary.settings }
    ];

    const cashierMenus = [
        { id: 'dashboard', label: dictionary.dashboard },
        { id: 'pos', label: dictionary.pos },
        { id: 'customers', label: dictionary.customers },
        { id: 'progress_report', label: dictionary.progress_report },
        { id: 'settings', label: lang === 'sw' ? 'Tengeneza Barcode' : 'Barcode Generates' }
    ];

    const menusToRender = userRole === 'admin' ? adminMenus : cashierMenus;

    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const filteredPosProducts = safeInventory.filter(p => {
        const query = posProductSearch.toLowerCase();
        return (p.product_name && p.product_name.toLowerCase().includes(query)) ||
               (p.barcode && String(p.barcode).includes(posProductSearch));
    });
    const lowStockItems = safeInventory.filter(p => p.quantity <= 5);

    const getTodayStr = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const todayStr = getTodayStr(); 
    const currentYearMonth = todayStr.substring(0, 7); 

    const getWeeklyCycleDay = () => {
        const d = new Date();
        const day = d.getDay(); 
        return day === 0 ? 7 : day; 
    };
    const currentCycleDay = getWeeklyCycleDay();
    const currentHour = new Date().getHours();
    const isReportDownloadAllowed = currentCycleDay === 7 && currentHour >= 23;

    const activeAlertsCount = (!pdfDownloaded && isReportDownloadAllowed ? 1 : 0) + lowStockItems.length;

    const safeSalesLog = Array.isArray(salesLog) ? salesLog : [];
    const salesTodayList = safeSalesLog.filter(s => s.sale_date === todayStr);
    
    const getStartAndEndOfWeek = () => {
        const d = new Date();
        const day = d.getDay();
        const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diffToMonday));
        monday.setHours(0,0,0,0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);
        
        return { monday, sunday };
    };

    const { monday: startOfWeekDate, sunday: endOfWeekDate } = getStartAndEndOfWeek();

    const salesWeeklyList = safeSalesLog.filter(s => { 
        if (!s.sale_date || typeof s.sale_date !== 'string') return false;
        const saleDateObj = new Date(s.sale_date);
        saleDateObj.setHours(0,0,0,0);
        return saleDateObj >= startOfWeekDate && saleDateObj <= endOfWeekDate;
    });
    const salesMonthlyList = safeSalesLog.filter(s => s.sale_date && s.sale_date.startsWith(currentYearMonth));

    const dailySales = salesSummary.today || salesTodayList.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    const weeklySales = salesSummary.weekly || salesWeeklyList.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    const monthlySales = salesSummary.monthly || salesMonthlyList.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

    const filteredProducts = safeInventory.filter(p => {
        const nameMatch = p.product_name && p.product_name.toLowerCase().includes(productSearch.toLowerCase());
        const barcodeMatch = p.barcode && String(p.barcode).includes(productSearch);
        return nameMatch || barcodeMatch;
    });

    const lastProductIdx = productPage * productsPerPage;
    const firstProductIdx = lastProductIdx - productsPerPage;
    const currentProductsList = filteredProducts.slice(firstProductIdx, lastProductIdx);
    const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);

    const todaySalesFeed = safeSalesLog.filter(s => s.sale_date === todayStr);

    const getPast7DaysData = () => {
        const d = new Date();
        const day = d.getDay();
        const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diffToMonday));

        const days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            const totalForDay = safeSalesLog.filter(s => s.sale_date === dateStr).reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
            return {
                dayNum: i + 1,
                dateStr: dateStr,
                amount: totalForDay
            };
        });

        const maxAmount = Math.max(...days.map(d => d.amount), 10000); // fallback to 10k max to avoid div by zero

        return days.map(d => {
            const computedHeight = Math.round((d.amount / maxAmount) * 200);
            const heightPx = Math.max(5, Math.min(200, computedHeight)) + "px"; 
            
            const dateParts = d.dateStr.split('-');
            const shortDate = `${dateParts[2]}-${dateParts[1]}`; // DD-MM format

            return {
                tareheDisp: `${dictionary.cycleText} ${d.dayNum} (${shortDate})`,
                fullDate: d.dateStr,
                kiasi: d.amount,
                urefu: heightPx
            };
        });
    };

    const getPageNumbers = () => {
        const pages = [];
        const startPage = Math.max(1, productPage - 2);
        const endPage = Math.min(totalProductPages, productPage + 2);
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className={`app-container print-type-${activePrintType}`} style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'sans-serif', backgroundColor: purpleTheme.bodyBg, margin: 0 }}>
            
            {/* SIDEBAR YA ZAMBARAU */}
            <div className="app-sidebar no-print" style={{ width: '260px', backgroundColor: purpleTheme.sidebarBg, color: purpleTheme.textMain, display: 'block', height: '100%', position: 'relative' }}>
                <div style={{ padding: '25px 20px', backgroundColor: purpleTheme.sidebarHeader, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{userRole === 'admin' ? 'AdminPanel' : 'CashierPanel'}</h3>
                    <small style={{ color: purpleTheme.textMuted, fontSize: '13px' }}>Mfumo wa Biashara</small>
                </div>
                
                <div style={{ padding: '15px 0', overflowY: 'auto', height: 'calc(100% - 170px)' }}>
                    {menusToRender.map(menu => (
                        <div 
                            key={menu.id}
                            onClick={() => { setActiveTab(menu.id); setProductPage(1); }}
                            style={{ 
                                padding: '15px 20px', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontWeight: activeTab === menu.id ? 'bold' : 'normal',
                                backgroundColor: activeTab === menu.id ? purpleTheme.activeTabBg : 'transparent',
                                color: activeTab === menu.id ? '#ffffff' : purpleTheme.textMuted,
                                borderLeft: activeTab === menu.id ? '4px solid #48bb78' : '4px solid transparent'
                            }}
                        >
                            <span>{menu.label}</span>
                            {/* BEJI NDOGO YA IDADI YA ARIFA KWENYE SIDEBAR MENU */}
                             {menu.id === 'settings' && userRole === 'admin' && activeAlertsCount > 0 && (
                                <span style={{ backgroundColor: '#e53e3e', color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' }}>
                                    {activeAlertsCount}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '15px 20px', backgroundColor: purpleTheme.sidebarHeader, boxSizing: 'border-box' }}>
                    <div style={{ marginBottom: '8px', fontSize: '14px', color: purpleTheme.textMuted }}>User: <strong>{userName}</strong></div>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>{dictionary.logout}</button>
                    <div style={{ fontSize: '11px', color: purpleTheme.textMuted, opacity: 0.6, textAlign: 'center' }}>© 2026 LYETA CLASSIC. All Rights Reserved.</div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="app-main-content no-print" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '30px' }}>
                <div style={{ borderBottom: '2px solid #edf2f7', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#2c2e3e', fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>{activeTab === 'pos' ? (lang === 'sw' ? 'Retail Point of Sale (POS)' : 'Retail Point of Sale (POS)') : activeTab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h2>
                        <small style={{ color: '#718096' }}>{dictionary.syncText}</small>
                    </div>

                    {/* SELECTOR YA KUBADILI LUGHA (LANGUAGE TOGGLE) KATI YA EN NA SW */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <select 
                            value={lang} 
                            onChange={(e) => setLang(e.target.value)} 
                            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fff', cursor: 'pointer' }}
                        >
                            <option value="sw">Kiswahili</option>
                            <option value="en">English</option>
                        </select>
                        <div style={{ backgroundColor: '#fff', padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e0', fontWeight: 'bold', color: '#231e5c', fontSize: '13px' }}>
                            {dictionary.dateLabel}: {todayStr} | {dictionary.cycleText} {currentCycleDay} {dictionary.ofWeek}
                        </div>
                    </div>
                </div>

                {/* RENDERING: DASHBOARD TAB CHENYE AUTOMATIC GRAPH YA PIXELS */}
                {activeTab === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {/* 1. Admin Metrics Cards (Only for Admin) */}
                        {userRole === 'admin' && (
                            <div className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'sw' ? 'Mauzo ya Leo' : 'Today Sales'}</h5>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>TSH {formatMoney(dailySales)}</div>
                                    <div style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>{lang === 'sw' ? 'Faida' : 'Net Profit'}: TSH {formatMoney(salesSummary.today_profit || 0)}</div>
                                </div>
                                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'sw' ? 'Mauzo ya Wiki' : 'Weekly Sales'}</h5>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>TSH {formatMoney(weeklySales)}</div>
                                    <div style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>{lang === 'sw' ? 'Faida' : 'Net Profit'}: TSH {formatMoney(salesSummary.weekly_profit || 0)}</div>
                                </div>
                                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang === 'sw' ? 'Mauzo ya Mwezi' : 'Monthly Sales'}</h5>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2d3748' }}>TSH {formatMoney(monthlySales)}</div>
                                    <div style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>{lang === 'sw' ? 'Faida' : 'Net Profit'}: TSH {formatMoney(salesSummary.monthly_profit || 0)}</div>
                                </div>
                            </div>
                        )}

                        {/* 2. Graph Card */}
                        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{dictionary.graphTitle}</h3>
                            <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 40px 0' }}>{dictionary.graphSub}</p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '270px', borderBottom: '2px solid #cbd5e0', paddingBottom: '10px', paddingLeft: '15px', paddingRight: '15px', backgroundColor: '#f7fafc', borderRadius: '6px', paddingTop: '20px' }}>
                                {getPast7DaysData().map((siku, index) => (
                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', margin: '0 12px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2b6cb0', marginBottom: '6px' }}>
                                            TSH {formatMoney(siku.kiasi)}
                                        </span>
                                        <div style={{ 
                                            width: '100%', 
                                            maxWidth: '40px', 
                                            height: siku.urefu, 
                                            backgroundColor: index === (currentCycleDay - 1) ? '#48bb78' : '#443b9c', 
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.4s ease-in-out',
                                            cursor: 'pointer',
                                            display: 'block'
                                        }} title={`${siku.tareheDisp} | Kiasi: TSH ${formatMoney(siku.kiasi)}`} />
                                        <span style={{ fontSize: '12px', color: '#4a5568', marginTop: '12px', fontWeight: 'bold' }}>
                                            {siku.tareheDisp}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '35px', display: 'flex', gap: '20px', fontSize: '13px', borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '14px', height: '14px', backgroundColor: '#443b9c', borderRadius: '3px' }}></div>
                                    <span style={{ color: '#4a5568', fontWeight: '500' }}>{dictionary.pastDays}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '14px', height: '14px', backgroundColor: '#48bb78', borderRadius: '3px' }}></div>
                                    <span style={{ color: '#4a5568', fontWeight: '500' }}>{dictionary.currentDayMode}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Admin Alerts and Top Selling Row (Only for Admin) */}
                        {userRole === 'admin' && (
                            <div className="dashboard-alert-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                                {/* Slow Selling Products (Top 5 Least Sold) */}
                                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#b7791f', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                        {lang === 'sw' ? 'Bidhaa Zisizouzika Sana (Top 5)' : 'Slowest-Selling Products (Top 5)'}
                                    </h4>
                                    
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#718096' }}>
                                                <th style={{ padding: '10px 0' }}>{lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}</th>
                                                <th style={{ padding: '10px 0', textAlign: 'right' }}>{lang === 'sw' ? 'Zilizouzwa' : 'Total Sold'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slowSellingProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" style={{ padding: '15px 0', color: '#a0aec0', fontStyle: 'italic' }}>
                                                        {lang === 'sw' ? 'Hakuna data iliyorekodiwa' : 'No data recorded yet'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                slowSellingProducts.map((p, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#2d3748' }}>
                                                            {idx + 1}. {p.product_name}
                                                        </td>
                                                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#b7791f' }}>
                                                            {p.total_sold} units
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Top Selling Products */}
                                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#2b6cb0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                        {lang === 'sw' ? 'Bidhaa Zinazouza Sana' : 'Top-Selling Products (Top 5)'}
                                    </h4>
                                    
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#718096' }}>
                                                <th style={{ padding: '10px 0' }}>{lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}</th>
                                                <th style={{ padding: '10px 0', textAlign: 'right' }}>{lang === 'sw' ? 'Zilizouzwa' : 'Total Sold'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topSellingProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" style={{ padding: '15px 0', color: '#a0aec0', fontStyle: 'italic' }}>
                                                        {lang === 'sw' ? 'Bado hakuna mauzo' : 'No sales recorded yet'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                topSellingProducts.map((p, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#2d3748' }}>
                                                            {idx + 1}. {p.product_name}
                                                        </td>
                                                        <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#2b6cb0' }}>
                                                            {p.total_sold} units
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PRODUCT STOCK CONTROL */}
                {activeTab === 'products' && (
                    <div>
                        {productPage === 1 && userRole === 'admin' && (
                            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>Add New Product (Secure Auto-Barcode Mode)</h3>
                                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    <input type="text" placeholder="Product Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', flex: '1 1 200px' }} required />
                                    <input type="number" placeholder="Capital (Buy Price)" value={newItemBuy} onChange={e => setNewItemBuy(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', flex: '1 1 120px' }} required />
                                    <input type="number" placeholder="Selling Price" value={newItemSell} onChange={e => setNewItemSell(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', flex: '1 1 120px' }} required />
                                    <input type="number" placeholder="Initial Stock" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', flex: '1 1 100px' }} required />
                                    <button type="submit" style={{ backgroundColor: '#48bb78', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save to DB</button>
                                </form>

                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: '#4a5568' }}>Bulk Import Station (Unlimited Products Mode)</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>Pakua template ya Excel, jaza bidhaa zako zote bila limit, kisha browse faili u-upload kwenda moja kwa moja kwenye database.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button type="button" onClick={downloadExcelTemplate} style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                                            Download Excel Template
                                        </button>
                                        <form onSubmit={handleExcelImport} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input type="file" accept=".csv" onChange={e => setExcelFile(e.target.files[0])} style={{ fontSize: '13px' }} />
                                            <button type="submit" style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                                                Import Bulk Products
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 style={{ margin: 0, color: '#2d3748' }}>Real-Time Store Inventory Management</h3>
                                <input type="text" placeholder="Type herufi yoyote kutafuta papo hapo..." value={productSearch} onChange={e => { setProductSearch(e.target.value); setProductPage(1); }} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '320px', fontWeight: '500' }} />
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#edf2f7', textAlign: 'left' }}>
                                        <th style={{ padding: '12px' }}>Product Name</th>
                                        <th style={{ padding: '12px' }}>Barcode (Auto Generated)</th>
                                        <th style={{ padding: '12px' }}>Capital (Buy)</th>
                                        <th style={{ padding: '12px' }}>Selling Price</th>
                                        <th style={{ padding: '12px' }}>Real Stock</th>
                                        <th style={{ padding: '12px' }}>Stock Status</th>
                                        {userRole === 'admin' && <th style={{ padding: '12px' }}>Actions Control</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProductsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={userRole === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: '20px', color: '#a0aec0' }}>No products match your search query.</td>
                                        </tr>
                                    ) : (
                                        currentProductsList.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2d3748' }}>{item.product_name}</td>
                                                <td style={{ padding: '12px' }}><code style={{ backgroundColor: '#f7fafc', color: '#4a5568', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>{item.barcode || 'N/A'}</code></td>
                                                <td style={{ padding: '12px' }}>TSH {formatMoney(item.buying_price)}</td>
                                                <td style={{ padding: '12px' }}>TSH {formatMoney(item.selling_price)}</td>
                                                <td style={{ padding: '12px' }}><strong>{item.quantity} Pcs</strong></td>
                                                <td style={{ padding: '12px' }}>
                                                    {item.quantity > 5
                                                        ? <span style={{ color: '#48bb78', fontWeight: 'bold' }}>IN STOCK</span>
                                                        : item.quantity > 0
                                                        ? <span style={{ color: '#dd6b20', fontWeight: 'bold' }}>LOW STOCK</span>
                                                        : <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>OUT OF STOCK</span>
                                                    }
                                                </td>
                                                {userRole === 'admin' && (
                                                    <td style={{ padding: '12px', display: 'flex', gap: '5px' }}>
                                                        <button onClick={() => handleUpdateStock(item.id, item.quantity)} style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Update Stock</button>
                                                        <button onClick={() => handleDeleteProduct(item.id)} style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {/* COMPRESSED ROLLING PAGINATION KWA AJILI YA BIDHAA 500+ */}
                            {totalProductPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '5px' }}>
                                    <button onClick={() => productPage > 1 && setProductPage(productPage - 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px' }} disabled={productPage === 1}>« Prev</button>
                                    
                                    {productPage > 3 && (
                                        <>
                                            <button onClick={() => setProductPage(1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', fontSize: '12px', cursor: 'pointer' }}>1</button>
                                            {productPage > 4 && <span style={{ padding: '0 5px', color: '#718096' }}>...</span>}
                                        </>
                                    )}

                                    {getPageNumbers().map(num => (
                                        <button key={num} onClick={() => setProductPage(num)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: productPage === num ? purpleTheme.activeTabBg : '#fff', color: productPage === num ? '#fff' : '#333', fontWeight: productPage === num ? 'bold' : 'normal', cursor: 'pointer', fontSize: '12px' }}>{num}</button>
                                    ))}

                                    {productPage < totalProductPages - 2 && (
                                        <>
                                            {productPage < totalProductPages - 3 && <span style={{ padding: '0 5px', color: '#718096' }}>...</span>}
                                            <button onClick={() => setProductPage(totalProductPages)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', fontSize: '12px', cursor: 'pointer' }}>{totalProductPages}</button>
                                        </>
                                    )}

                                    <button onClick={() => productPage < totalProductPages && setProductPage(productPage + 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px' }} disabled={productPage === totalProductPages}>Next »</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB YA POS TERMINAL (UZA BIDHAA) */}
                {activeTab === 'pos' && (
                    <div className="pos-layout-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                        {/* UPANDE WA KUSHOTO: GARI LA MANUNUZI (CART) */}
                        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>
                                {lang === 'sw' ? "Gari la Manunuzi (Shopping Cart)" : "Shopping Cart"} ({cart.length})
                            </h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#edf2f7', textAlign: 'left' }}>
                                        <th style={{ padding: '12px' }}>{lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}</th>
                                        <th style={{ padding: '12px' }}>{lang === 'sw' ? 'Bei' : 'Price'}</th>
                                        <th style={{ padding: '12px' }}>{lang === 'sw' ? 'Idadi' : 'Qty'}</th>
                                        <th style={{ padding: '12px' }}>Subtotal</th>
                                        <th style={{ padding: '12px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#a0aec0', fontWeight: 'bold' }}>
                                                {lang === 'sw' ? "Gari la manunuzi liko wazi. Tafadhali ongeza bidhaa!" : "Your cart is empty. Please add products!"}
                                            </td>
                                        </tr>
                                    ) : (
                                        cart.map(item => (
                                            <tr key={item.product_id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.product_name}</td>
                                                <td style={{ padding: '12px' }}>TSH {formatMoney(item.selling_price)}</td>
                                                <td style={{ padding: '12px' }}>{item.quantity} Pcs</td>
                                                <td style={{ padding: '12px', fontWeight: '600' }}>TSH {formatMoney(item.selling_price * item.quantity)}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <button onClick={() => handleRemoveFromCart(item.product_id)} style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                        {lang === 'sw' ? 'Ondoa' : 'Remove'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* UPANDE WA KULIA: KUONGEZA KWENYE CART NA CHECKOUT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>
                                    {lang === 'sw' ? 'Chagua Bidhaa ya Kuuza' : 'Select Product to Sell'}
                                </h4>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                        {lang === 'sw' ? 'Tafuta Bidhaa (Jina au Barcode)' : 'Search Product (Name or Barcode)'}
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder={lang === 'sw' ? "Andika jina au barcode..." : "Search by name or barcode..."}
                                        value={posProductSearch}
                                        onChange={e => setPosProductSearch(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', marginBottom: '10px', boxSizing: 'border-box', fontWeight: '500' }}
                                    />
                                    <select 
                                        value={selectedProductId} 
                                        onChange={e => setSelectedProductId(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    >
                                        <option value="">-- {lang === 'sw' ? 'Chagua Bidhaa' : 'Select Product'} --</option>
                                        {filteredPosProducts.map(p => (
                                            <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                                {p.product_name} - TSH {formatMoney(p.selling_price)} (Stoki: {p.quantity} Pcs) {p.quantity <= 0 ? ' [OUT OF STOCK]' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                        {lang === 'sw' ? 'Idadi (Quantity)' : 'Quantity'}
                                    </label>
                                    <input 
                                        type="number" 
                                        value={sellQty} 
                                        onChange={e => setSellQty(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <button 
                                    onClick={handleAddToCart}
                                    style={{ width: '100%', padding: '12px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                                >
                                    {lang === 'sw' ? 'Weka Kwenye Gari' : 'Add to Cart'}
                                </button>
                            </div>

                            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #48bb78' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#276749' }}>
                                    {lang === 'sw' ? 'Malipo na Kukamilisha' : 'Payment & Checkout'}
                                </h4>

                                {/* CUSTOMER SELECTION / REGISTRATION */}
                                <div style={{ marginBottom: '15px', borderBottom: '1px dashed #cbd5e0', paddingBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>
                                            {lang === 'sw' ? 'Mteja (Customer)' : 'Customer'}
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                                            style={{ border: 'none', backgroundColor: 'transparent', color: '#3182ce', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline' }}
                                        >
                                            {showNewCustomerForm 
                                                ? (lang === 'sw' ? 'Chagua Mteja' : 'Select Customer') 
                                                : (lang === 'sw' ? '+ Sajili Mpya' : '+ Add New')}
                                        </button>
                                    </div>

                                    {!showNewCustomerForm ? (
                                        <select 
                                            value={selectedCustomerId} 
                                            onChange={e => setSelectedCustomerId(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                        >
                                            <option value="">-- {lang === 'sw' ? 'Mteja wa Kawaida (Anonymous)' : 'Walk-in Customer'} --</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.phone !== 'N/A' ? `(${c.phone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#f7fafc', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
                                            <input 
                                                type="text" 
                                                placeholder={lang === 'sw' ? 'Jina la Mteja' : 'Customer Name'} 
                                                value={newCustomerName}
                                                onChange={e => setNewCustomerName(e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder={lang === 'sw' ? 'Namba ya Simu (mfano: +255712345678)' : 'Phone Number (e.g. +255712345678)'} 
                                                value={newCustomerPhone}
                                                onChange={e => {
                                                    let val = e.target.value;
                                                    if (!val.startsWith('+255')) {
                                                        val = '+255';
                                                    }
                                                    const suffix = val.substring(4).replace(/\D/g, '');
                                                    setNewCustomerPhone('+255' + suffix);
                                                }}
                                                maxLength={13}
                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px', boxSizing: 'border-box' }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={async () => {
                                                    if (!newCustomerName) { alert(lang === 'sw' ? 'Weka jina la mteja!' : 'Enter customer name!'); return; }
                                                    
                                                    let cleanPhone = newCustomerPhone ? newCustomerPhone.trim() : '';
                                                    if (cleanPhone && cleanPhone !== '+255') {
                                                        if (cleanPhone.length !== 13 || !cleanPhone.startsWith('+255')) {
                                                            alert(lang === 'sw' 
                                                                ? 'Namba ya simu si sahihi! Lazima iwe na tarakimu 9 baada ya +255 (Jumla ya herufi 13, mfano: +255789876788).' 
                                                                : 'Invalid phone number! Must have exactly 9 digits after +255 (Total 13 characters, e.g. +255789876788).');
                                                            return;
                                                        }
                                                    } else {
                                                        cleanPhone = ''; // Ikiwa ni +255 tu bila namba mbele, weka null
                                                    }
                                                    
                                                    try {
                                                        const response = await axios.post('/sales-management-system/public/api/customers', {
                                                            name: newCustomerName,
                                                            phone: cleanPhone || null
                                                        });
                                                        if (response.data && response.data.status === 'success') {
                                                            alert(response.data.message);
                                                            // Refresh customer list
                                                            axios.get('/sales-management-system/public/api/customers')
                                                                .then(res => {
                                                                    if (Array.isArray(res.data)) {
                                                                        setCustomers(res.data);
                                                                        setSelectedCustomerId(response.data.customer.id);
                                                                        setShowNewCustomerForm(false);
                                                                        setNewCustomerName('');
                                                                        setNewCustomerPhone('+255');
                                                                    }
                                                                });
                                                        }
                                                    } catch (err) {
                                                        alert(err.response?.data?.message || 'Failed to save customer');
                                                    }
                                                }}
                                                style={{ backgroundColor: '#48bb78', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                            >
                                                {lang === 'sw' ? 'Hifadhi Mteja' : 'Save Customer'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                        {lang === 'sw' ? 'Njia ya Malipo' : 'Payment Method'}
                                    </label>
                                    <select 
                                        value={paymentMethod} 
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                    >
                                        <option value="cash">{lang === 'sw' ? 'Cash (Taslimu)' : 'Cash'}</option>
                                        <option value="m-pesa">M-Pesa</option>
                                        <option value="tigo-pesa">Tigo Pesa</option>
                                        <option value="airtel-money">Airtel Money</option>
                                        <option value="bank">{lang === 'sw' ? 'Bank Transfer' : 'Bank'}</option>
                                    </select>
                                </div>

                                <div style={{ borderTop: '2px solid #edf2f7', paddingTop: '15px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', color: '#2d3748' }}>
                                        <span>Total:</span>
                                        <span>TSH {formatMoney(cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0))}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    style={{ 
                                        width: '100%', 
                                        padding: '14px', 
                                        backgroundColor: cart.length > 0 ? '#48bb78' : '#cbd5e0', 
                                        color: '#fff', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: cart.length > 0 ? 'pointer' : 'not-allowed', 
                                        fontWeight: 'bold', 
                                        fontSize: '15px' 
                                    }}
                                >
                                    {lang === 'sw' ? 'Kamilisha Mauzo' : 'Checkout'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB YA SALES REPORTS */}
                {activeTab === 'sales' && (
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>{dictionary.salesTableTitle}</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                                <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '14px', textTransform: 'uppercase' }}>{lang === 'sw' ? 'Leo' : 'Today'}</h5>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748' }}>Mauzo: TSH {formatMoney(dailySales)}</div>
                                <div style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>Faida (Profit): TSH {formatMoney(salesSummary.today_profit || 0)}</div>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                                <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '14px', textTransform: 'uppercase' }}>{lang === 'sw' ? 'Wiki Hii' : 'Weekly'}</h5>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748' }}>Mauzo: TSH {formatMoney(weeklySales)}</div>
                                <div style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>Faida (Profit): TSH {formatMoney(salesSummary.weekly_profit || 0)}</div>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                                <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '14px', textTransform: 'uppercase' }}>{lang === 'sw' ? 'Mwezi Huu' : 'Monthly'}</h5>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d3748' }}>Mauzo: TSH {formatMoney(monthlySales)}</div>
                                <div style={{ fontSize: '14px', color: '#2f855a', fontWeight: 'bold', marginTop: '6px' }}>Faida (Profit): TSH {formatMoney(salesSummary.monthly_profit || 0)}</div>
                            </div>
                        </div>

                        <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>{dictionary.salesTableSub}</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#edf2f7', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>{dictionary.thCycle}</th>
                                    <th style={{ padding: '12px' }}>{dictionary.thTotal}</th>
                                    <th style={{ padding: '12px', color: '#2f855a' }}>{dictionary.thProfit}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const d = new Date();
                                    const day = d.getDay();
                                    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
                                    const monday = new Date(d.setDate(diffToMonday));
                                    
                                    return Array.from({ length: 7 }).map((_, idx) => {
                                        const sikuNamba = idx + 1;
                                        const date = new Date(monday);
                                        date.setDate(monday.getDate() + idx);
                                        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                        
                                        const totalKiasiSiku = safeSalesLog.filter(s => s.sale_date === dateStr).reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
                                        const totalProfitSiku = safeSalesLog.filter(s => s.sale_date === dateStr).reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);
                                        
                                        const dateParts = dateStr.split('-');
                                        const shortDate = `${dateParts[2]}-${dateParts[1]}`; // DD-MM format
                                        
                                        return (
                                            <tr key={sikuNamba} style={{ borderBottom: '1px solid #edf2f7', backgroundColor: dateStr === todayStr ? '#f0fff4' : 'transparent' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#4a5568' }}>
                                                    {dictionary.cycleText} {sikuNamba} ({shortDate}) {dateStr === todayStr ? (lang === 'sw' ? "(Leo)" : "(Today)") : ""}
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '600' }}>TSH {formatMoney(totalKiasiSiku)}</td>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2f855a' }}>TSH {formatMoney(totalProfitSiku)}</td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB YA CUSTOMER DIRECTORY */}
                {activeTab === 'customers' && (
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>
                            {dictionary.customers || 'Customer Directory'} ({customers.length})
                        </h3>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#edf2f7', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>{dictionary.customerName || 'Customer Name'}</th>
                                    <th style={{ padding: '12px' }}>{dictionary.phone || 'Phone Number'}</th>
                                    <th style={{ padding: '12px' }}>{dictionary.totalSpent || 'Total Spent'}</th>
                                    <th style={{ padding: '12px' }}>{dictionary.regDate || 'Registration Date'}</th>
                                    <th style={{ padding: '12px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#a0aec0' }}>
                                            {dictionary.noCustomers || 'No customers registered yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#2d3748' }}>{c.name}</td>
                                            <td style={{ padding: '12px' }}>{c.phone || 'N/A'}</td>
                                            <td style={{ padding: '12px', fontWeight: '600' }}>TSH {formatMoney(c.total_spent)}</td>
                                            <td style={{ padding: '12px' }}>{c.created_at || 'N/A'}</td>
                                            <td style={{ padding: '12px' }}>
                                                <button 
                                                    onClick={() => fetchCustomerHistory(c.id)} 
                                                    style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    {dictionary.historyBtn || 'History'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* CASHIER MANAGEMENT TAB (KWA ADMIN PEKEE) */}
                {activeTab === 'cashier' && userRole === 'admin' && (
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>System Cashiers ({cashiersList.length})</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#edf2f7', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Cashier Name</th>
                                    <th style={{ padding: '12px' }}>Email</th>
                                    <th style={{ padding: '12px' }}>Password</th>
                                    <th style={{ padding: '12px' }}>Status Ruhusa</th>
                                    <th style={{ padding: '12px' }}>Action Control</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(cashiersList) && cashiersList.length > 0 ? cashiersList.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.name}</td>
                                        <td style={{ padding: '12px' }}>{c.email}</td>
                                        <td style={{ padding: '12px' }}><code style={{ backgroundColor: '#f7fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontWeight: 'bold', color: '#333' }}>{c.plain_password || '123'}</code></td>
                                        <td style={{ padding: '12px' }}>{c.status === 'active' ? <span style={{ backgroundColor: '#c6f6d5', color: '#22543d', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>PERMITTED</span> : <span style={{ backgroundColor: '#fed7d7', color: '#742a2a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>ACCESS DENIED</span>}</td>
                                        <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                            <button onClick={() => toggleCashierStatus(c.id, c.status)} style={{ backgroundColor: c.status === 'active' ? '#e53e3e' : '#48bb78', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>{c.status === 'active' ? 'Block Access' : 'Approve / Permit'}</button>
                                            <button onClick={() => changeCashierPasswordPrompt(c.id)} style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Change Pass</button>
                                            <button onClick={() => deleteCashier(c.id, c.name)} style={{ backgroundColor: '#718096', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Remove</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>Hakuna Cashier yeyote aliyesajiliwa kwenye mfumo.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PROGRESS REPORT TAB (IF FUNGU LAKO HALIJAFIKIA SIKU YA 7 HALIRUHUSU KUDOWNLOAD KABISA) */}
                {activeTab === 'progress_report' && (
                    <div style={{ backgroundColor: '#fff', padding: '40px 25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <div style={{ padding: '30px 20px', border: '1px dashed #cbd5e0', borderRadius: '6px', backgroundColor: '#f7fafc', display: 'inline-block', width: '100%', maxWidth: '500px' }}>
                            <button 
                                className="no-print-btn" 
                                disabled={false}
                                onClick={() => {
                                    const now = new Date();
                                    const dateStr = now.toLocaleDateString();
                                    const timeStr = now.toLocaleTimeString();
                                    const fullTimestamp = `${dateStr} ${timeStr}`;
                                    setDownloadTimestamp(fullTimestamp);

                                    // Wait a short moment for state to render inside PDF DOM before printing
                                    setTimeout(() => {
                                        const element = document.getElementById('printable-report-area');
                                        element.style.display = 'block';
                                        
                                        const opt = {
                                            margin:       0.4,
                                            filename:     `Business_Progress_Report_Day_${currentCycleDay}_${todayStr}.pdf`,
                                            image:        { type: 'jpeg', quality: 0.98 },
                                            html2canvas:  { scale: 2, useCORS: true },
                                            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                                        };
                                        
                                        html2pdf().set(opt).from(element).save().then(() => {
                                            element.style.display = 'none';
                                            setPdfDownloaded(true);
                                        }).catch(err => {
                                            console.error(err);
                                            element.style.display = 'none';
                                            alert("Kuna hitilafu ilitokea wakati wa kupakua PDF. Jaribu tena!");
                                        });
                                    }, 100);
                                }} 
                                style={{ 
                                    padding: '14px 35px', 
                                    backgroundColor: '#e53e3e', 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold', 
                                    fontSize: '15px', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.5px' 
                                }}
                            >
                                {lang === 'sw' 
                                    ? `Download Report PDF (Siku ya ${currentCycleDay} ya Mzunguko)` 
                                    : `Download Report PDF (Day ${currentCycleDay} of Cycle)`
                                }
                            </button>
                        </div>

                        {/* Area deleted and moved to root level */}

                        {/* AREA INAYOOKOTOA NA KUCHORA JEDWALI SAFARI HII NDANI YA PDF TU PALE UNAPOPRINT */}
                        <div id="printable-report-area" style={{ display: 'none', textAlign: 'left', color: '#000', padding: '30px', fontFamily: 'sans-serif' }}>
                            <div style={{ textAlign: 'center', borderBottom: '3px double #1a1a1a', paddingBottom: '15px', marginBottom: '25px' }}>
                                <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    LYETA CLASSIC
                                </h1>
                                <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4a5568' }}>
                                    {lang === 'sw' ? "RIPOTI YA MAENDELEO YA BIASHARA YA WIKI" : "WEEKLY BUSINESS PROGRESS REPORT"}
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>
                                    <strong>{lang === 'sw' ? 'Tarehe ya Ripoti' : 'Report Date'}:</strong> {todayStr} | <strong>{lang === 'sw' ? 'Mzunguko' : 'Cycle'}:</strong> {lang === 'sw' ? `Siku ya ${currentCycleDay} ya Mzunguko (Siku 1 - 7)` : `Day ${currentCycleDay} of Cycle (Days 1 - 7)`}
                                </p>
                            </div>
                            
                            <h3 style={{ margin: '30px 0 15px 0', fontSize: '15px', color: '#2d3748', textTransform: 'uppercase', borderBottom: '2px solid #3182ce', paddingBottom: '5px', fontWeight: 'bold' }}>
                                {lang === 'sw' ? "JEDWALI A: HALI YA STOKI YA KAWAIDA (BIDHAA ZISIZOONGEZWA)" : "TABLE A: NORMAL PRODUCT STOCK FLOW (NO ADDITIONS)"}
                            </h3>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12px', marginBottom: '35px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f7fafc' }}>
                                        <th style={{ border: '1px solid #a0aec0', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{lang === 'sw' ? 'Mzunguko' : 'Cycle'}</th>
                                        <th style={{ border: '1px solid #a0aec0', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}</th>
                                        <th style={{ border: '1px solid #a0aec0', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Stock In (Mwanzo)' : 'Stock In'}</th>
                                        <th style={{ border: '1px solid #a0aec0', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Stock Out (Iliyouzwa)' : 'Stock Out'}</th>
                                        <th style={{ border: '1px solid #a0aec0', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Real Stock (Zilizobaki)' : 'Real Stock'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockReportList.length > 0 ? (
                                        stockReportList.map((item, index) => {
                                            const startMMDD = `${startOfWeekDate.getMonth() + 1}/${startOfWeekDate.getDate()}`;
                                            const endMMDD = `${endOfWeekDate.getMonth() + 1}/${endOfWeekDate.getDate()}`;
                                            return (
                                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                    <td style={{ border: '1px solid #cbd5e0', padding: '8px' }}>{lang === 'sw' ? 'Siku 1 - 7' : 'Day 1 - 7'} ({startMMDD} - {endMMDD})</td>
                                                    <td style={{ border: '1px solid #cbd5e0', padding: '8px', fontWeight: '500' }}>{item.product_name}</td>
                                                    <td style={{ border: '1px solid #cbd5e0', padding: '8px', textAlign: 'center' }}>{item.stock_in} Pcs</td>
                                                    <td style={{ border: '1px solid #cbd5e0', padding: '8px', textAlign: 'center', color: '#e53e3e' }}>{item.stock_out} Pcs</td>
                                                    <td style={{ border: '1px solid #cbd5e0', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#2b6cb0' }}>{item.real_stock} Pcs</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ border: '1px solid #cbd5e0', padding: '20px', textAlign: 'center', color: '#a0aec0', fontStyle: 'italic' }}>
                                                {lang === 'sw' ? 'Hakuna bidhaa za kawaida zilizopatikana' : 'No normal product flow available'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Page 1 Footer and Page Break */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#718096', borderTop: '1px solid #cbd5e0', paddingTop: '10px', marginTop: '20px' }}>
                                <span>{lang === 'sw' ? 'Muda wa kupakua' : 'Downloaded at'}: {downloadTimestamp}</span>
                                <span>{lang === 'sw' ? 'Ukurasa 1 wa 2' : 'Page 1 of 2'}</span>
                            </div>
                            <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>

                            <h3 style={{ margin: '30px 0 15px 0', fontSize: '15px', color: '#c53030', textTransform: 'uppercase', borderBottom: '2px solid #e53e3e', paddingBottom: '5px', fontWeight: 'bold' }}>
                                {lang === 'sw' ? "JEDWALI B: NYONGEZA YA STOKI NA ARIFA (PRODUCTS ADDED / ALERT FLOW)" : "TABLE B: PRODUCT STOCK ADDITIONS & ALERT FLOW"}
                            </h3>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fff5f5' }}>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{lang === 'sw' ? 'Mzunguko' : 'Cycle'}</th>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{lang === 'sw' ? 'Jina la Bidhaa' : 'Product Name'}</th>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Stock In (Mwanzo)' : 'Stock In Before'}</th>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Stock Out' : 'Stock Out'}</th>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Zilizobaki Kabla' : 'Remain Stock'}</th>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Kiasi Kilichoongezwa' : 'Product Added'}</th>
                                        <th style={{ border: '1px solid #e53e3e', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lang === 'sw' ? 'Stoki Mpya Halisi' : 'Real Stock'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockUpdatesList.length > 0 ? (
                                        stockUpdatesList.map((item, index) => {
                                            const startMMDD = `${startOfWeekDate.getMonth() + 1}/${startOfWeekDate.getDate()}`;
                                            const endMMDD = `${endOfWeekDate.getMonth() + 1}/${endOfWeekDate.getDate()}`;
                                            return (
                                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fff8f8' }}>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px' }}>{lang === 'sw' ? 'Siku 1 - 7' : 'Day 1 - 7'} ({startMMDD} - {endMMDD})</td>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px', fontWeight: '500' }}>{item.product_name}</td>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px', textAlign: 'center' }}>{item.initial_stock} Pcs</td>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px', textAlign: 'center', color: '#e53e3e' }}>{item.stock_out} Pcs</td>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px', textAlign: 'center', color: '#718096' }}>{item.remain_stock} Pcs</td>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#38a169' }}>+{item.added_stock} Pcs</td>
                                                    <td style={{ border: '1px solid #fed7d7', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#2b6cb0' }}>{item.real_stock} Pcs</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ border: '1px solid #fed7d7', padding: '20px', textAlign: 'center', color: '#718096', fontStyle: 'italic' }}>
                                                {lang === 'sw' ? 'Hakuna bidhaa iliyorekodiwa kuongezewa mzigo stoo wiki hii' : 'No products restocked/added this week'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Sehemu ya CEO Kusaini Katikati ya Document */}
                            <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <div style={{ width: '220px', borderBottom: '1px solid #1a1a1a', marginBottom: '8px' }}></div>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', color: '#2d3748', textTransform: 'uppercase' }}>
                                    CEO
                                </span>
                                <span style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
                                    LYETA CLASSIC ENTERPRISE
                                </span>
                            </div>

                            {/* Page 2 Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#718096', borderTop: '1px solid #cbd5e0', paddingTop: '10px', marginTop: '40px' }}>
                                <span>{lang === 'sw' ? 'Muda wa kupakua' : 'Downloaded at'}: {downloadTimestamp}</span>
                                <span>{lang === 'sw' ? 'Ukurasa 2 wa 2' : 'Page 2 of 2'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div style={{ width: '100%' }}>
                        {userRole === 'cashier' ? (
                            /* CASHIER PANEL: ONLY SHOW THE GENERATE BARCODE LABELS CARD, NOTHING ELSE */
                            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                                    <h3 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '16px', fontWeight: 'bold' }}>
                                        {lang === 'sw' ? 'Tengeneza Lebo za Barcode' : 'Generate Barcode Labels'}
                                    </h3>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                            {lang === 'sw' ? 'Chagua Bidhaa' : 'Select Product'}
                                        </label>
                                        <select 
                                            value={labelProductId} 
                                            onChange={e => setLabelProductId(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                        >
                                            <option value="">-- {lang === 'sw' ? 'Chagua Bidhaa' : 'Select Product'} --</option>
                                            {safeInventory.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.product_name} ({p.barcode || `LYETA${p.id}`})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                            {lang === 'sw' ? 'Idadi ya Vibandiko (Lebo)' : 'Number of Labels'}
                                        </label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="50" 
                                            value={labelQty}
                                            onChange={e => setLabelQty(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button 
                                            onClick={handleDownloadBarcodePDF}
                                            style={{ flex: 1, padding: '12px', backgroundColor: '#48bb78', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}
                                        >
                                            {lang === 'sw' ? 'Pakua PDF' : 'Download PDF'}
                                        </button>
                                        <button 
                                            onClick={handlePrintBarcodeBrowser}
                                            style={{ flex: 1, padding: '12px', backgroundColor: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}
                                        >
                                            {lang === 'sw' ? 'Chapa (Print)' : 'Print Labels'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ADMIN PANEL: SHOW THE STANDARD FULL SETTINGS GRID */
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                
                                {/* UPANDE WA KUSHOTO: CONTROL FORMS & ALERTS CONDITIONAL GRID */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    {/* Form ya Barcode Label Generator */}
                                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                                        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '16px', fontWeight: 'bold' }}>
                                            {lang === 'sw' ? 'Tengeneza Lebo za Barcode' : 'Generate Barcode Labels'}
                                        </h3>
                                        
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                                {lang === 'sw' ? 'Chagua Bidhaa' : 'Select Product'}
                                            </label>
                                            <select 
                                                value={labelProductId} 
                                                onChange={e => setLabelProductId(e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px' }}
                                            >
                                                <option value="">-- {lang === 'sw' ? 'Chagua Bidhaa' : 'Select Product'} --</option>
                                                {safeInventory.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.product_name} ({p.barcode || `LYETA${p.id}`})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '6px' }}>
                                                {lang === 'sw' ? 'Idadi ya Vibandiko (Lebo)' : 'Number of Labels'}
                                            </label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="50" 
                                                value={labelQty}
                                                onChange={e => setLabelQty(e.target.value)}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <button 
                                                onClick={handleDownloadBarcodePDF}
                                                style={{ flex: 1, padding: '12px', backgroundColor: '#48bb78', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}
                                            >
                                                {lang === 'sw' ? 'Pakua PDF' : 'Download PDF'}
                                            </button>
                                            <button 
                                                onClick={handlePrintBarcodeBrowser}
                                                style={{ flex: 1, padding: '12px', backgroundColor: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}
                                            >
                                                {lang === 'sw' ? 'Chapa (Print)' : 'Print Labels'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Form ya Password Reset */}
                                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                                        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '16px' }}>Password Reset Control</h3>
                                        <input 
                                            type="text" 
                                            placeholder="Weka password mpya hapa..." 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #cbd5e0', borderRadius: '4px', boxSizing: 'border-box', WebkitTextSecurity: 'disc', textSecurity: 'disc' }} 
                                            autoComplete="off"
                                        />
                                        <button 
                                            onClick={async () => {
                                                if (!newPassword) { alert("Tafadhali weka password mpya!"); return; }
                                                const loggedInUserId = userId || localStorage.getItem('user_id');
                                                try {
                                                    const response = await axios.post('/sales-management-system/public/api/change-password', {
                                                        user_id: parseInt(loggedInUserId),
                                                        password: newPassword
                                                    });
                                                    if (response.data && response.data.status === 'success') {
                                                        alert("Hongera! Password mpya imesasishwa kikamilifu.");
                                                        setNewPassword('');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Imeshindwa kusasisha password: " + (err.response?.data?.message || err.message));
                                                }
                                            }} 
                                            style={{ width: '100%', padding: '12px', background: '#3182ce', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                                        >
                                            Update Password
                                        </button>
                                    </div>

                                    {/* Ulinzi & Hifadhi ya Mfumo (Security & Backup Control) */}
                                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                                        <h3 style={{ margin: '0 0 20px 0', color: '#2d3748', fontSize: '16px', fontWeight: 'bold' }}>
                                            {lang === 'sw' ? 'Ulinzi & Hifadhi ya Mfumo' : 'Security & Database Backup'}
                                        </h3>
                                        
                                        {/* 2FA Toggle Switch */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                            <div style={{ paddingRight: '10px' }}>
                                                <strong style={{ display: 'block', fontSize: '14px', color: '#2d3748' }}>
                                                    {lang === 'sw' ? 'Ulinzi wa Hatua Mbili (2FA)' : 'Two-Factor Authentication (2FA)'}
                                                </strong>
                                                <span style={{ fontSize: '12px', color: '#718096' }}>
                                                    {lang === 'sw' ? 'Washa kutuma msimbo wa ulinzi kwenye Email wakati wa kuingia' : 'Enable email verification codes during sign in'}
                                                </span>
                                            </div>
                                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', flexShrink: 0 }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={userTwoFactorEnabled}
                                                    onChange={handleToggle2FA}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span style={{
                                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: userTwoFactorEnabled ? '#25d366' : '#ccc',
                                                    transition: '.4s', borderRadius: '34px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute', content: '""', height: '18px', width: '18px', left: userTwoFactorEnabled ? '28px' : '4px', bottom: '4px',
                                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                                    }}></span>
                                                </span>
                                            </label>
                                        </div>

                                        {/* Database Backup Trigger */}
                                        <div style={{ padding: '15px', backgroundColor: '#f0fff4', borderRadius: '6px', border: '1px solid #c6f6d5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '14px', color: '#276749' }}>
                                                    {lang === 'sw' ? 'Hifadhi Data (Database Backup)' : 'Export System Database'}
                                                </strong>
                                                <span style={{ fontSize: '12px', color: '#38a169' }}>
                                                    {lang === 'sw' ? 'Pakua nakala ya data zote za duka (.sql) kwa usalama' : 'Download a full database backup file (.sql) to your device'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={handleDownloadBackup}
                                                disabled={backingUp}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    backgroundColor: backingUp ? '#cbd5e0' : '#48bb78',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    cursor: backingUp ? 'not-allowed' : 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                {backingUp ? (lang === 'sw' ? 'Inatayarisha...' : 'Backing up...') : (lang === 'sw' ? 'Hifadhi Sasa (Backup Now)' : 'Backup Now')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* SANDUKU LA ARIFA LINAFUTIKA KABISA NA HALIONEKANI KAMA HAKUNA ARIFA YOYOTE */}
                                    {activeAlertsCount > 0 && (
                                        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e53e3e' }}>
                                            <h3 style={{ margin: '0 0 15px 0', color: '#c53030', fontSize: '16px', fontWeight: 'bold' }}>{dictionary.alertInstructionTitle}</h3>
                                            
                                            {!pdfDownloaded && isReportDownloadAllowed && (
                                                <div style={{ padding: '12px', backgroundColor: '#fffaf0', borderLeft: '3px solid #dd6b20', marginBottom: '12px', fontSize: '13px', fontWeight: 'bold', color: '#b7791f', borderRadius: '4px' }}>
                                                    1. {dictionary.alertPdfText}
                                                </div>
                                            )}

                                            {lowStockItems.map((item, index) => (
                                                <div key={item.id} style={{ padding: '12px', backgroundColor: '#fff5f5', borderLeft: '3px solid #e53e3e', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: '#c53030', borderRadius: '4px' }}>
                                                    {!pdfDownloaded && isReportDownloadAllowed ? index + 2 : index + 1}. {dictionary.alertStockText1}{item.product_name}{dictionary.alertStockText2}{item.quantity}).
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* UPANDE WA KULIA: DATA LOGS (SALES LOG YA SIKU LEO TU NA VIUNGO VYA PUSH) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    
                                    {/* Live Sales Log ya Siku Husika tu */}
                                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h3 style={{ margin: 0, fontSize: '15px', color: '#2d3748', fontWeight: 'bold' }}>{dictionary.liveSalesTitle}</h3>
                                            <span 
                                                onClick={() => setViewAllSales(!viewAllSales)} 
                                                style={{ fontSize: '12px', color: '#3182ce', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                                            >
                                                {viewAllSales ? dictionary.closeLogBtn : dictionary.viewAllBtn}
                                            </span>
                                        </div>
                                        
                                        <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                                            {(viewAllSales ? safeSalesLog : todaySalesFeed).map((sale, idx) => (
                                                <div key={idx} style={{ padding: '11px', borderBottom: '1px solid #f7fafc', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <strong>{lang === 'sw' ? 'Bidhaa' : 'Item'}: {sale.product_name || "Stock Transaction"}</strong>
                                                        <div style={{ fontSize: '11px', color: '#718096', marginTop: '3px' }}>
                                                            {lang === 'sw' ? 'Muda' : 'Time'}: {sale.time || "03:11 PM"} | Cashier: {sale.cashier_name || "System"} | Method: {sale.payment_method ? sale.payment_method.toUpperCase() : "CASH"}
                                                        </div>
                                                    </div>
                                                    <span style={{ backgroundColor: '#c6f6d5', color: '#22543d', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                        TSH {formatMoney(sale.total_amount)}
                                                    </span>
                                                </div>
                                            ))}
                                            {(viewAllSales ? safeSalesLog : todaySalesFeed).length === 0 && (
                                                <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0, textAlign: 'center', padding: '10px' }}>{dictionary.noSalesToday}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ACTIVITY LOGS TAB (ADMIN ONLY) */}
                {activeTab === 'activity_logs' && userRole === 'admin' && (
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #edf2f7', paddingBottom: '15px', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px', fontWeight: 'bold' }}>
                                    {lang === 'sw' ? 'Marekodi ya Uendeshaji wa Mfumo' : 'System Activity Logs'}
                                </h3>
                                <small style={{ color: '#718096' }}>
                                    {lang === 'sw' ? 'Logs za shughuli za Cashier, vifaa vinavyotumika, na anwani za IP.' : 'Real-time logs of cashier actions, device user agents, and IP addresses.'}
                                </small>
                            </div>
                            <button 
                                onClick={fetchActivityLogs}
                                disabled={refreshingLogs}
                                style={{ 
                                    padding: '8px 16px', 
                                    backgroundColor: refreshingLogs ? '#a0aec0' : '#3182ce', 
                                    color: '#fff', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: refreshingLogs ? 'not-allowed' : 'pointer', 
                                    fontWeight: 'bold', 
                                    fontSize: '13px' 
                                }}
                            >
                                {refreshingLogs 
                                    ? (lang === 'sw' ? 'Inapakia...' : 'Refreshing...') 
                                    : (lang === 'sw' ? 'Pakua Upya' : 'Refresh Logs')}
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#4a5568' }}>{lang === 'sw' ? 'Muda' : 'Timestamp'}</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#4a5568' }}>{lang === 'sw' ? 'Mtumiaji (Cashier)' : 'Cashier Name'}</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#4a5568' }}>{lang === 'sw' ? 'Matendo / Shughuli' : 'Action / Activity'}</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#4a5568' }}>{lang === 'sw' ? 'Kifaa / Kivinjari' : 'Device / Browser'}</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#4a5568' }}>{lang === 'sw' ? 'IP Address' : 'IP Address'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.length > 0 ? (
                                        activityLogs.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                <td style={{ padding: '12px', color: '#718096', whiteSpace: 'nowrap' }}>{log.created_at}</td>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2d3748' }}>{log.cashier_name}</td>
                                                <td style={{ padding: '12px', color: '#2d3748' }}>
                                                    <span style={{ 
                                                        backgroundColor: log.action.includes('Logged') ? '#ebf8ff' : (log.action.includes('Completed') ? '#f0fff4' : '#fffaf0'), 
                                                        color: log.action.includes('Logged') ? '#2b6cb0' : (log.action.includes('Completed') ? '#22543d' : '#b7791f'),
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px', 
                                                        fontWeight: 'bold',
                                                        fontSize: '11px',
                                                        display: 'inline-block'
                                                    }}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', color: '#4a5568' }}>
                                                    <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        💻 {log.device}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', color: '#718096', fontFamily: 'monospace' }}>{log.ip_address}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '25px', textAlign: 'center', color: '#a0aec0', fontStyle: 'italic' }}>
                                                {lang === 'sw' ? 'Hakuna kumbukumbu za mfumo zilizopatikana.' : 'No system activity logs found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && lastSaleReceipt && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }} className="receipt-modal-overlay">
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        width: '100%',
                        maxWidth: printerType === '58mm' ? '290px' : '380px',
                        boxSizing: 'border-box',
                        color: '#000',
                        transition: 'max-width 0.3s ease'
                    }} className="receipt-modal-content">
                        {/* Printable Receipt Container */}
                        <div id="printable-receipt" style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            color: '#000',
                            padding: '10px',
                            backgroundColor: '#fff'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>LYETA CLASSIC</h3>
                                <p style={{ margin: '0 0 5px 0' }}>Magomen Street</p>
                                <p style={{ margin: '0 0 10px 0' }}>Tel: 0712345678</p>
                                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Receipt No:</span>
                                    <span>#{lastSaleReceipt.sale_id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Date:</span>
                                    <span>{lastSaleReceipt.date}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Cashier:</span>
                                    <span>{lastSaleReceipt.cashier_name}</span>
                                </div>
                                {lastSaleReceipt.customer && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Customer:</span>
                                        <span>{lastSaleReceipt.customer.name} ({lastSaleReceipt.customer.phone || 'N/A'})</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                            {/* Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px dashed #000' }}>
                                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                                        <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '4px 0' }}>Price</th>
                                        <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lastSaleReceipt.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '4px 0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                                            <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatMoney(item.price)}</td>
                                            <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatMoney(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                    <span>Net Amount (Excl. VAT):</span>
                                    <span>TSH {formatMoney(Math.round(lastSaleReceipt.total / 1.18))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                    <span>VAT (18% Inclusive):</span>
                                    <span>TSH {formatMoney(lastSaleReceipt.total - Math.round(lastSaleReceipt.total / 1.18))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px dashed #000', paddingTop: '4px' }}>
                                    <span>TOTAL (Incl. VAT):</span>
                                    <span>TSH {formatMoney(lastSaleReceipt.total)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '5px' }}>
                                    <span>Payment Method:</span>
                                    <span>{lastSaleReceipt.payment_method.toUpperCase()}</span>
                                </div>
                            </div>

                            <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                            {/* CSS Barcode */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px' }}>
                                <Barcode39 value={`LYETA${lastSaleReceipt.sale_id}`} height={35} />
                                <span style={{ fontSize: '10px', marginTop: '5px', letterSpacing: '2px' }}>*LYETA{lastSaleReceipt.sale_id}*</span>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px' }}>
                                <p style={{ margin: 0 }}>Thank you for shopping with us!</p>
                                <p style={{ margin: '5px 0 0 0' }}>Welcome again</p>
                            </div>
                        </div>

                        {/* Printer Type Selector */}
                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }} className="no-print">
                            <label style={{ fontWeight: 'bold', color: '#4a5568' }}>
                                {lang === 'sw' ? 'Ukubwa wa Karatasi (Printer)' : 'Receipt Paper Size'}:
                            </label>
                            <select 
                                value={printerType} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setPrinterType(val);
                                    localStorage.setItem('printerType', val);
                                }}
                                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fff', cursor: 'pointer' }}
                            >
                                <option value="80mm">80 mm (Standard)</option>
                                <option value="58mm">58 mm (Small)</option>
                            </select>
                        </div>

                        {/* Modal Controls */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }} className="no-print">
                            <button
                                onClick={() => {
                                    window.print();
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#48bb78',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                {dictionary.print || 'Print'}
                            </button>
                            <button
                                onClick={() => handleSendReceiptWhatsApp(lastSaleReceipt)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#25d366',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.79-4.024c1.65.981 3.27 1.503 4.966 1.504 5.485.002 9.947-4.437 9.95-9.887.001-2.639-1.025-5.12-2.89-6.988C17.009 2.738 14.524 1.71 11.897 1.71 6.42 1.71 1.958 6.148 1.955 11.598c-.001 1.816.48 3.593 1.39 5.169l-1.011 3.69 3.793-.994c1.554.846 3.125 1.313 4.713 1.313zm9.646-6.428c-.282-.141-1.666-.822-1.924-.916c-.258-.094-.446-.141-.634.141c-.188.281-.727.916-.892 1.101c-.164.186-.33.208-.612.067-.282-.141-1.189-.438-2.263-1.398-.836-.747-1.401-1.668-1.565-1.95c-.164-.282-.017-.435.124-.575c.127-.126.282-.328.423-.492c.141-.164.188-.282.282-.47c.094-.188.047-.352-.023-.492c-.07-.141-.634-1.529-.868-2.09c-.229-.55-.459-.475-.634-.484c-.164-.008-.352-.01-.54-.01c-.188 0-.493.07-.751.352c-.258.282-.986.963-.986 2.348c0 1.385 1.008 2.72 1.149 2.908c.141.188 1.984 3.03 4.806 4.243c.67.289 1.194.461 1.602.592c.673.214 1.285.184 1.768.111c.539-.081 1.666-.68 1.9-.1.338 2.338-.282 3.753-.375 3.94-.094.188-.258.282-.54.141z"/>
                                </svg>
                                {lang === 'sw' ? 'WhatsApp' : 'WhatsApp'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowReceiptModal(false);
                                    setLastSaleReceipt(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#718096',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                {dictionary.close || 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Purchase History Modal */}
            {showHistoryModal && selectedCustomerHistory && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }} className="no-print">
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '25px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        width: '100%',
                        maxWidth: '550px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
                            {dictionary.customerHistoryTitle || 'Purchase History for'} {selectedCustomerHistory.customer.name}
                        </h3>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                            {selectedCustomerHistory.sales.length === 0 ? (
                                <p style={{ color: '#a0aec0', fontStyle: 'italic', textAlign: 'center', margin: '20px 0' }}>
                                    {lang === 'sw' ? 'Hakuna manunuzi yaliyofanyika bado.' : 'No purchases recorded yet.'}
                                </p>
                            ) : (
                                selectedCustomerHistory.sales.map(sale => (
                                    <div key={sale.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '15px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                                            <span style={{ color: '#2b6cb0' }}>{dictionary.receiptNo || 'Receipt'}: #{sale.id}</span>
                                            <span>TSH {formatMoney(sale.total_amount)}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '10px' }}>
                                            {dictionary.dateLabel || 'Date'}: {sale.sale_date} {sale.time} | {dictionary.paymentMethod || 'Method'}: {sale.payment_method.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '13px', backgroundColor: '#f7fafc', padding: '8px', borderRadius: '4px' }}>
                                            <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#a0aec0', marginBottom: '4px' }}>
                                                {dictionary.items || 'Items'}
                                            </strong>
                                            {sale.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                                    <span>{item.product_name}</span>
                                                    <span>{item.quantity} x TSH {formatMoney(item.price_at_sale)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setShowHistoryModal(false);
                                setSelectedCustomerHistory(null);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#718096',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {dictionary.close || 'Close'}
                        </button>
                    </div>
                </div>
            )}

            {/* AREA INAYOOKOTOA NA KUCHORA VIBANDIKO VYA BARCODE KWENYE PDF (Root Level to ensure constant rendering) */}
            <div id="printable-barcodes-area" style={{ 
                position: 'absolute', 
                left: '-9999px', 
                top: '-9999px', 
                backgroundColor: '#fff', 
                color: '#000', 
                padding: '20px', 
                width: '100%', 
                boxSizing: 'border-box' 
            }}>
                {(barcodeLabelsToPrint || barcodeLabelsToDownload) && (
                    <div>
                        <h4 style={{ textAlign: 'center', margin: '0 0 20px 0', borderBottom: '2px solid #000', paddingBottom: '10px', fontWeight: 'bold', fontSize: '18px' }}>
                            LYETA CLASSIC - BARCODE PRINT SHEET
                        </h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px',
                            padding: '10px'
                        }}>
                            {Array.from({ length: (barcodeLabelsToPrint || barcodeLabelsToDownload).qty }).map((_, idx) => (
                                <div key={idx} style={{
                                    border: '1px dashed #333',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    backgroundColor: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxSizing: 'border-box',
                                    pageBreakInside: 'avoid',
                                    breakInside: 'avoid'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px', color: '#000' }}>LYETA CLASSIC</span>
                                    <span style={{ fontSize: '11px', color: '#1a1a1a', marginBottom: '8px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                        {(barcodeLabelsToPrint || barcodeLabelsToDownload).productName}
                                    </span>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '6px' }}>
                                        <Barcode39 value={(barcodeLabelsToPrint || barcodeLabelsToDownload).barcode} height={35} />
                                    </div>
                                    <span style={{ fontSize: '10px', letterSpacing: '2px', fontWeight: 'bold', color: '#000' }}>
                                        *{(barcodeLabelsToPrint || barcodeLabelsToDownload).barcode}*
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* STYLE MAALUM YA KUFICHA SIDEBAR WAKATI WA KUCHAPA PDF MAALUM */}
            <style>{`
                @media (max-width: 768px) {
                    .app-container {
                        flex-direction: column !important;
                        height: auto !important;
                        overflow-y: auto !important;
                    }
                    .app-sidebar {
                        width: 100% !important;
                        height: auto !important;
                        display: block !important;
                        position: relative !important;
                    }
                    .app-sidebar > div:nth-child(2) {
                        height: auto !important;
                        max-height: 250px !important;
                    }
                    .app-sidebar > div:nth-child(3) {
                        position: relative !important;
                        width: 100% !important;
                        padding: 10px !important;
                    }
                    .app-main-content {
                        padding: 15px !important;
                        height: auto !important;
                        overflow-y: visible !important;
                    }
                    .dashboard-metrics-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .dashboard-alert-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .pos-layout-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @page {
                    size: ${activePrintType === 'barcodes' ? 'A4 portrait' : (printerType === '58mm' ? '58mm' : '80mm')} auto;
                    margin: ${activePrintType === 'barcodes' ? '0.5in' : '0mm'};
                }
                @media print {
                    /* Reset the main app wrappers to allow block printing */
                    #app, #app > div {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }
                    .no-print, .no-print * {
                        display: none !important;
                    }
                    /* If printing barcodes, hide the receipt and progress report */
                    .print-type-barcodes .receipt-modal-overlay,
                    .print-type-barcodes #printable-report-area,
                    .print-type-barcodes #printable-receipt {
                        display: none !important;
                    }
                    /* If printing barcodes, show the barcodes area */
                    .print-type-barcodes #printable-barcodes-area {
                        position: relative !important;
                        left: 0 !important;
                        top: 0 !important;
                        display: block !important;
                    }
                    .receipt-modal-overlay {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        background: none !important;
                        background-color: transparent !important;
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        z-index: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .receipt-modal-content {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 8px !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        background: #fff !important;
                        box-sizing: border-box !important;
                    }
                    #printable-receipt {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }
                    #printable-report-area, #printable-report-area * {
                        visibility: visible;
                    }
                    #printable-report-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<MainApp />);
}