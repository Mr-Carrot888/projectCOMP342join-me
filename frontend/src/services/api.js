const API_BASE = 'http://localhost:3000';

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
    // 1. สมัครสมาชิก (Register)
    async register(userData) {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'สมัครสมาชิกไม่สำเร็จ');
        return data;
    },

    // 2. เข้าสู่ระบบ (Login)
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

    // 3. ดึงโพสต์กิจกรรม (Get Posts / Search)
    async getPosts(keyword = '', category = '') {
        const params = new URLSearchParams();
        if (keyword) params.append('keyword', keyword);
        if (category && category !== 'all') params.append('category', category);

        const res = await fetch(`${API_BASE}/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลโพสต์ได้');
        return await res.json();
    },

    // 4. สร้างโพสต์กิจกรรม (Create Post)
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

    // 5. ส่งคำขอเข้าร่วมกิจกรรม (Send Join Request)
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

    // 6. ดึงคำขอของโพสต์ที่เราเป็น Host (แก้ไขจุดบั๊กข้อความซ้ำซ้อน และป้องกัน undefined)
    async getMyRequests() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return [];

        try {
            const postsRes = await fetch(`${API_BASE}/api/posts`);
            if (!postsRes.ok) return [];
            const posts = await postsRes.json();

            const myPosts = posts.filter(p => String(p.host_id).trim() === String(user.user_id).trim());
            let allRequests = [];

            for (const p of myPosts) {
                try {
                    const res = await fetch(`${API_BASE}/api/requests/post/${p.post_id}`, {
                        headers: getAuthHeader()
                    });
                    if (res.ok) {
                        const reqs = await res.json();
                        const formatted = reqs.map(r => {
                            // ดึง ID ของผู้ขอเข้าร่วมจากทุกคีย์ที่เป็นไปได้
                            const reqId = r.requester_id || r.user_id || r.student_id || r.sender_id || '';
                            const reqName = r.requester_name || r.name || (reqId ? `รหัส ${reqId}` : 'ผู้ขอเข้าร่วม');
                            return {
                                ...r,
                                requester_id: reqId,
                                post_title: p.title || 'กิจกรรม', // ใช้ชื่อโพสต์จริงเท่านั้น ไม่นำข้อความเดิมมาต่อซ้ำ
                                host_id: p.host_id,
                                requester_name: reqName
                            };
                        });
                        allRequests = allRequests.concat(formatted);
                    }
                } catch (err) {
                    console.error('ดึงคำขอของโพสต์ไม่สำเร็จ:', err);
                }
            }

            return allRequests;
        } catch (error) {
            console.error('getMyRequests Error:', error);
            return [];
        }
    },

    // 7. อนุมัติ / ปฏิเสธคำขอ (Respond Request)
    async respondRequest(requestId, status) {
        const res = await fetch(`${API_BASE}/api/requests/${requestId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ status }) // 'Accepted' หรือ 'Rejected'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'อัปเดตสถานะไม่สำเร็จ');
        return data;
    },

    // 8. ดึงประวัติข้อความแชท (Get Chat Messages)
    async getChatMessages(requestId) {
        const res = await fetch(`${API_BASE}/api/chats/${requestId}`, {
            headers: getAuthHeader()
        });
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อความได้');
        return await res.json();
    },

    // 9. ส่งข้อความแชท (Send Message / Location Sharing)
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