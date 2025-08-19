<template>
    <div class="admin-dashboard">
        <!-- Admin Header -->
        <header class="admin-header">
            <div class="admin-nav">
                <h1>Desk Admin Dashboard</h1>
                <nav class="nav-tabs">
                    <button
                        :class="{ active: activeTab === 'submissions' }"
                        @click="activeTab = 'submissions'"
                    >
                        Submissions ({{ unreadCount }})
                    </button>
                    <button
                        :class="{ active: activeTab === 'approved' }"
                        @click="activeTab = 'approved'"
                    >
                        Approved Desks
                    </button>
                    <button
                        :class="{ active: activeTab === 'settings' }"
                        @click="activeTab = 'settings'"
                    >
                        Settings
                    </button>
                </nav>
            </div>
        </header>

        <!-- Loading State -->
        <div
            v-if="loading"
            class="loading"
        >
            Loading submissions...
        </div>

        <!-- Error State -->
        <div
            v-else-if="error"
            class="error"
        >
            {{ error }}
        </div>

        <!-- Submissions Tab -->
        <div
            v-else-if="activeTab === 'submissions'"
            class="admin-content"
        >
            <div class="submissions-header">
                <h2>Pending Submissions</h2>
                <div class="filters">
                    <select
                        v-model="statusFilter"
                        @change="loadSubmissions"
                    >
                        <option value="all">All Status</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            <div
                v-if="submissions.length === 0"
                class="empty-state"
            >
                No submissions found.
            </div>

            <div
                v-else
                class="submissions-grid"
            >
                <div
                    v-for="submission in submissions"
                    :key="submission.id"
                    class="submission-card"
                    :class="{ unread: submission.desk_submissions?.[0]?.status === 'unread' }"
                >
                    <!-- Submission Preview -->
                    <div class="submission-preview">
                        <img
                            :src="submission.profile_image_url"
                            :alt="`${submission.name}'s profile`"
                            class="profile-image"
                        />
                        <div class="submission-info">
                            <h3>{{ submission.name }}</h3>
                            <p class="title">{{ submission.title }}</p>
                            <p class="location">{{ submission.location }}</p>
                            <p class="date">{{ formatDate(submission.created_at) }}</p>
                        </div>
                    </div>

                    <!-- Status Badge -->
                    <div class="status-section">
                        <span
                            class="status-badge"
                            :class="submission.desk_submissions?.[0]?.status || 'unknown'"
                        >
                            {{ submission.desk_submissions?.[0]?.status || 'unknown' }}
                        </span>
                    </div>

                    <!-- Action Buttons -->
                    <div class="action-buttons">
                        <button
                            @click="reviewSubmission(submission)"
                            class="btn btn-primary"
                        >
                            Review
                        </button>
                        <button
                            @click="markAsRead(submission)"
                            v-if="submission.desk_submissions?.[0]?.status === 'unread'"
                            class="btn btn-secondary"
                        >
                            Mark Read
                        </button>
                        <button
                            @click="approveSubmission(submission)"
                            class="btn btn-success"
                            v-if="submission.status === 'pending'"
                        >
                            Approve
                        </button>
                        <button
                            @click="rejectSubmission(submission)"
                            class="btn btn-danger"
                            v-if="submission.status === 'pending'"
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Approved Desks Tab -->
        <div
            v-else-if="activeTab === 'approved'"
            class="admin-content"
        >
            <h2>Approved Desks</h2>
            <div class="approved-grid">
                <div
                    v-for="desk in approvedDesks"
                    :key="desk.id"
                    class="approved-card"
                >
                    <img
                        :src="desk.profile_image_url"
                        :alt="desk.name"
                    />
                    <h3>{{ desk.name }}</h3>
                    <p>{{ desk.title }}</p>
                    <button
                        @click="editDesign(desk)"
                        class="btn btn-primary"
                    >
                        Edit Design
                    </button>
                </div>
            </div>
        </div>

        <!-- Settings Tab -->
        <div
            v-else-if="activeTab === 'settings'"
            class="admin-content"
        >
            <h2>Settings</h2>
            <div class="settings-section">
                <h3>Storage Buckets</h3>
                <p>SVG Design Files:</p>
                <ul>
                    <li>desk-decor (Decorations)</li>
                    <li>desk-monitors (Monitor Frames)</li>
                    <li>desk-screens (Screen Content)</li>
                </ul>
            </div>
        </div>

        <!-- Review Modal -->
        <ReviewModal
            v-if="selectedSubmission"
            :submission="selectedSubmission"
            @close="selectedSubmission = null"
            @status-updated="handleStatusUpdate"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../lib/supabase.js';
import ReviewModal from './ReviewModal.vue';

// ==========================================
// REACTIVE STATE
// ==========================================

const activeTab = ref('submissions');
const loading = ref(true);
const error = ref(null);
const submissions = ref([]);
const approvedDesks = ref([]);
const statusFilter = ref('all');
const selectedSubmission = ref(null);

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

const unreadCount = computed(() => {
    return submissions.value.filter(s =>
        s.desk_submissions?.[0]?.status === 'unread'
    ).length;
});

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(async () => {
    await loadSubmissions();
    await loadApprovedDesks();
    loading.value = false;
});

// ==========================================
// DATA LOADING
// ==========================================

async function loadSubmissions() {
    try {
        let query = supabase
            .from('desks')
            .select(`
        *,
        desk_submissions (
          id,
          status,
          created_at
        )
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        // Apply status filter if needed
        if (statusFilter.value !== 'all') {
            query = query.eq('desk_submissions.status', statusFilter.value);
        }

        const { data, error: loadError } = await query;

        if (loadError) {
            throw loadError;
        }

        submissions.value = data || [];
    } catch (err) {
        console.error('Error loading submissions:', err);
        error.value = 'Failed to load submissions';
    }
}

async function loadApprovedDesks() {
    try {
        const { data, error: loadError } = await supabase
            .from('desks')
            .select('*')
            .eq('status', 'approved')
            .order('approved_at', { ascending: false });

        if (loadError) {
            throw loadError;
        }

        approvedDesks.value = data || [];
    } catch (err) {
        console.error('Error loading approved desks:', err);
    }
}

// ==========================================
// ACTIONS
// ==========================================

function reviewSubmission(submission) {
    selectedSubmission.value = submission;
}

async function markAsRead(submission) {
    try {
        const { error } = await supabase
            .from('desk_submissions')
            .update({ status: 'read' })
            .eq('desk_id', submission.id);

        if (error) throw error;

        // Update local state
        const submissionIndex = submissions.value.findIndex(s => s.id === submission.id);
        if (submissionIndex !== -1) {
            submissions.value[submissionIndex].desk_submissions[0].status = 'read';
        }
    } catch (err) {
        console.error('Error marking as read:', err);
        alert('Failed to update status');
    }
}

async function approveSubmission(submission) {
    if (!confirm('Are you sure you want to approve this desk?')) return;

    try {
        const { error } = await supabase
            .from('desks')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                // approved_by: null // Remove this until proper user management is implemented
            })
            .eq('id', submission.id);

        if (error) throw error;

        // Remove from submissions and add to approved
        submissions.value = submissions.value.filter(s => s.id !== submission.id);
        await loadApprovedDesks();

        alert('Desk approved successfully!');
    } catch (err) {
        console.error('Error approving submission:', err);
        alert('Failed to approve desk');
    }
}

async function rejectSubmission(submission) {
    if (!confirm('Are you sure you want to reject this desk?')) return;

    try {
        const { error } = await supabase
            .from('desks')
            .update({ status: 'rejected' })
            .eq('id', submission.id);

        if (error) throw error;

        // Remove from submissions
        submissions.value = submissions.value.filter(s => s.id !== submission.id);

        alert('Desk rejected');
    } catch (err) {
        console.error('Error rejecting submission:', err);
        alert('Failed to reject desk');
    }
}

function editDesign(desk) {
    // TODO: Open design editor modal
    alert(`Edit design for ${desk.name} - Coming soon!`);
}

function handleStatusUpdate() {
    // Reload submissions when status is updated in modal
    loadSubmissions();
}

// ==========================================
// UTILITIES
// ==========================================

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<style scoped lang="scss">
.admin-dashboard {
    min-height: 100dvh;
    background: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-header {
    background: white;
    border-bottom: 1px solid #e1e5e9;
    padding: 0;
}

.admin-nav {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;

    h1 {
        margin: 0 0 1rem 0;
        color: #1a1a1a;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .nav-tabs {
        display: flex;
        gap: 0;

        button {
            padding: 0.75rem 1.5rem;
            border: none;
            background: transparent;
            color: #666;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;

            &:hover {
                color: #333;
                background: #f8f9fa;
            }

            &.active {
                color: #007bff;
                border-bottom-color: #007bff;
                font-weight: 500;
            }
        }
    }
}

.admin-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.submissions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h2 {
        margin: 0;
        color: #1a1a1a;
    }

    .filters select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
    }
}

.submissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.submission-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    &.unread {
        border-left: 4px solid #007bff;
        background: #f8f9ff;
    }
}

.submission-preview {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;

    .profile-image {
        width: 60px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
    }

    .submission-info {
        flex: 1;

        h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.1rem;
            color: #1a1a1a;
        }

        p {
            margin: 0.1rem 0;
            font-size: 0.9rem;
            color: #666;

            &.title {
                font-weight: 500;
                color: #333;
            }
        }
    }
}

.status-section {
    margin-bottom: 1rem;

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;

        &.unread {
            background: #e3f2fd;
            color: #1976d2;
        }

        &.read {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        &.pending {
            background: #fff3e0;
            color: #f57c00;
        }
    }
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.2s;

        &.btn-primary {
            background: #007bff;
            color: white;

            &:hover {
                background: #0056b3;
            }
        }

        &.btn-secondary {
            background: #6c757d;
            color: white;

            &:hover {
                background: #545b62;
            }
        }

        &.btn-success {
            background: #28a745;
            color: white;

            &:hover {
                background: #1e7e34;
            }
        }

        &.btn-danger {
            background: #dc3545;
            color: white;

            &:hover {
                background: #c82333;
            }
        }
    }
}

.approved-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

.approved-card {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 1rem;
    }

    h3 {
        margin: 0.5rem 0;
        color: #1a1a1a;
    }

    p {
        margin: 0 0 1rem 0;
        color: #666;
    }
}

.loading,
.error,
.empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-size: 1.1rem;
}

.error {
    color: #dc3545;
}

.settings-section {
    background: white;
    padding: 2rem;
    border-radius: 8px;

    h3 {
        margin-top: 0;
        color: #1a1a1a;
    }

    ul {
        list-style: none;
        padding: 0;

        li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;

            &:last-child {
                border-bottom: none;
            }
        }
    }
}
</style>
