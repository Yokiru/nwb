// NWB.CREATIVE Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://agefrdpkkrmddzjlyszn.supabase.co',
    anonKey: 'sb_publishable_rRVtXYoMFaxI3A_jFE_6yg_SYgbonpP'
};

// Initialize Supabase client
let supabase = null;

async function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }

    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return supabase;
}

// Generate unique order number
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NWB-${timestamp.slice(-4)}${random}`;
}

// Create new order
async function createOrder(orderData) {
    if (!supabase) await initSupabase();

    const orderNumber = generateOrderNumber();

    const { data, error } = await supabase
        .from('orders')
        .insert([{
            order_number: orderNumber,
            name: orderData.name,
            whatsapp: orderData.whatsapp,
            email: orderData.email || null,
            judul: orderData.judul,
            konsep: orderData.konsep,
            teks_tambahan: orderData.teksTambahan || null,
            logo: orderData.logo || null,
            warna: orderData.warna || null,
            ukuran: orderData.ukuran || null,
            info_lainnya: orderData.infoLainnya || null,
            status: 'pending'
        }])
        .select();

    if (error) {
        console.error('Error creating order:', error);
        throw error;
    }

    return { orderNumber, data };
}

// Get order by order number (for tracking)
async function getOrderByNumber(orderNumber) {
    if (!supabase) await initSupabase();

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.toUpperCase())
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }

    return data;
}

// Get all orders (for admin)
async function getAllOrders() {
    if (!supabase) await initSupabase();

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return data;
}

// Update order status (for admin)
async function updateOrderStatus(orderId, status) {
    if (!supabase) await initSupabase();

    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select();

    if (error) {
        console.error('Error updating order:', error);
        throw error;
    }

    return data;
}

// Get order statistics (for admin dashboard)
async function getOrderStats() {
    if (!supabase) await initSupabase();

    const { data, error } = await supabase
        .from('orders')
        .select('status');

    if (error) {
        console.error('Error fetching stats:', error);
        return null;
    }

    const stats = {
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        in_progress: data.filter(o => o.status === 'in_progress').length,
        revision: data.filter(o => o.status === 'revision').length,
        completed: data.filter(o => o.status === 'completed').length,
        cancelled: data.filter(o => o.status === 'cancelled').length
    };

    return stats;
}

// Export for use in other scripts
window.NWB = {
    initSupabase,
    generateOrderNumber,
    createOrder,
    getOrderByNumber,
    getAllOrders,
    updateOrderStatus,
    getOrderStats
};
