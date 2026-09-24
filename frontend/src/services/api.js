const API_BASE = 'http://localhost:3000';

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
    // เข้าสู่ระบบ
    async login(email, password) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        return data;
    },

    // ดึงโพสต์กิจกรรม
    async getPosts(keyword = '', category = '') {
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (category && category !== 'all') params.append('category', category);

        const res = await fetch(`${API_BASE}/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลโพสต์ได้');
        return await res.json();
    },

    // สร้างโพสต์กิจกรรม
    async createPost(postData) {
        const res = await fetch(`${API_BASE}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(postData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'สร้างโพสต์ไม่สำเร็จ');
        return data;
    },

    // ส่งคำขอเข้าร่วม
    async sendRequest(postId) {
        const res = await fetch(`${API_BASE}/api/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ post_id: postId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'ส่งคำขอเข้าร่วมไม่สำเร็จ');
        return data;
    },

    // อนุมัติ/ปฏิเสธคำขอ
    async respondRequest(requestId, status) {
        const res = await fetch(`${API_BASE}/api/requests/${requestId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'อัปเดตสถานะไม่สำเร็จ');
        return data;
    },

    // ดึงข้อความแชท
    async getChatMessages(requestId) {
        const res = await fetch(`${API_BASE}/api/chats/${requestId}`, {
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อความได้');
        return await res.json();
    },

    // ส่งข้อความ
    async sendMessage(requestId, receiverId, content, isLocation = false) {
        const res = await fetch(`${API_BASE}/api/chats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({
                request_id: requestId,
                receiver_id: receiverId,
                content: content,
                is_location_sharing: isLocation ? 1 : 0
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'ส่งข้อความไม่สำเร็จ');
        return data;
    }
};