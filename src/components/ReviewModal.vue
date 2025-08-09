<template>
    <div
        class="modal-overlay"
        @click="$emit('close')"
    >
        <div
            class="modal-content"
            @click.stop
        >
            <div class="modal-header">
                <h2>Review Submission: {{ submission.name }}</h2>
                <button
                    @click="$emit('close')"
                    class="close-btn"
                >&times;</button>
            </div>

            <div class="modal-body">
                <!-- Submission Details -->
                <div class="submission-details">
                    <div class="detail-section">
                        <h3>Personal Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Name:</label>
                                <span>{{ submission.name }}</span>
                            </div>
                            <div class="detail-item">
                                <label>Job Title:</label>
                                <span>{{ submission.title }}</span>
                            </div>
                            <div class="detail-item">
                                <label>Location:</label>
                                <span>{{ submission.location }}</span>
                            </div>
                            <div class="detail-item">
                                <label>Submitted:</label>
                                <span>{{ formatDate(submission.created_at) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Social Media -->
                    <div
                        class="detail-section"
                        v-if="hasSocialLinks"
                    >
                        <h3>Social Media</h3>
                        <div class="social-links">
                            <a
                                v-if="submission.social_facebook"
                                :href="submission.social_facebook"
                                target="_blank"
                            >
                                Facebook
                            </a>
                            <a
                                v-if="submission.social_twitter"
                                :href="submission.social_twitter"
                                target="_blank"
                            >
                                Twitter/X
                            </a>
                            <a
                                v-if="submission.social_linkedin"
                                :href="submission.social_linkedin"
                                target="_blank"
                            >
                                LinkedIn
                            </a>
                            <a
                                v-if="submission.social_website"
                                :href="submission.social_website"
                                target="_blank"
                            >
                                Website
                            </a>
                        </div>
                    </div>

                    <!-- Images -->
                    <div class="detail-section">
                        <h3>Images</h3>

                        <!-- Profile Image -->
                        <div class="image-section">
                            <h4>Profile Picture</h4>
                            <div class="image-container">
                                <img
                                    :src="submission.profile_image_url"
                                    :alt="`${submission.name}'s profile`"
                                    class="profile-image"
                                />
                            </div>
                        </div>

                        <!-- Desk Photos -->
                        <div class="image-section">
                            <h4>Desk Photos ({{ submission.submitted_photos?.length || 0 }})</h4>
                            <div class="desk-photos-grid">
                                <div
                                    v-for="(photo, index) in submission.submitted_photos"
                                    :key="index"
                                    class="photo-container"
                                >
                                    <img
                                        :src="photo"
                                        :alt="`Desk photo ${index + 1}`"
                                        @click="openImagePreview(photo)"
                                        class="desk-photo"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Design Section -->
                    <div class="detail-section">
                        <h3>Custom Design Elements</h3>
                        <div class="design-section">

                            <!-- SVG Upload Areas -->
                            <div class="svg-upload-grid">
                                <!-- Decoration SVG -->
                                <div class="svg-upload-area">
                                    <h4>Decoration SVG</h4>
                                    <div
                                        class="upload-zone"
                                        :class="{ 'has-file': decorSvg }"
                                        @click="triggerFileInput('decor')"
                                        @dragover.prevent
                                        @drop.prevent="handleDrop($event, 'decor')"
                                    >
                                        <div
                                            v-if="!decorSvg"
                                            class="upload-placeholder"
                                        >
                                            <span>Drop SVG or click to upload</span>
                                        </div>
                                        <div
                                            v-else
                                            class="uploaded-file"
                                        >
                                            <span>{{ decorSvg.name }}</span>
                                            <button
                                                @click.stop="removeFile('decor')"
                                                class="remove-btn"
                                            >&times;</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Monitor SVG -->
                                <div class="svg-upload-area">
                                    <h4>Monitor Frame SVG</h4>
                                    <div
                                        class="upload-zone"
                                        :class="{ 'has-file': monitorSvg }"
                                        @click="triggerFileInput('monitor')"
                                        @dragover.prevent
                                        @drop.prevent="handleDrop($event, 'monitor')"
                                    >
                                        <div
                                            v-if="!monitorSvg"
                                            class="upload-placeholder"
                                        >
                                            <span>Drop SVG or click to upload</span>
                                        </div>
                                        <div
                                            v-else
                                            class="uploaded-file"
                                        >
                                            <span>{{ monitorSvg.name }}</span>
                                            <button
                                                @click.stop="removeFile('monitor')"
                                                class="remove-btn"
                                            >&times;</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Screen Content SVG -->
                                <div class="svg-upload-area">
                                    <h4>Screen Content SVG</h4>
                                    <div
                                        class="upload-zone"
                                        :class="{ 'has-file': screenSvg }"
                                        @click="triggerFileInput('screen')"
                                        @dragover.prevent
                                        @drop.prevent="handleDrop($event, 'screen')"
                                    >
                                        <div
                                            v-if="!screenSvg"
                                            class="upload-placeholder"
                                        >
                                            <span>Drop SVG or click to upload</span>
                                        </div>
                                        <div
                                            v-else
                                            class="uploaded-file"
                                        >
                                            <span>{{ screenSvg.name }}</span>
                                            <button
                                                @click.stop="removeFile('screen')"
                                                class="remove-btn"
                                            >&times;</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Upload Progress -->
                            <div
                                v-if="uploading"
                                class="upload-progress"
                            >
                                Uploading SVG files... {{ uploadProgress }}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <!-- Status Update Buttons -->
                <div class="status-buttons">
                    <button
                        @click="updateSubmissionStatus('read')"
                        v-if="currentStatus === 'unread'"
                        class="btn btn-secondary"
                    >
                        Mark as Read
                    </button>
                    <button
                        @click="updateDeskStatus('approved')"
                        v-if="submission.status === 'pending'"
                        class="btn btn-success"
                        :disabled="uploading"
                    >
                        Approve Desk
                    </button>
                    <button
                        @click="updateDeskStatus('rejected')"
                        v-if="submission.status === 'pending'"
                        class="btn btn-danger"
                    >
                        Reject Desk
                    </button>
                </div>

                <div class="action-buttons">
                    <button
                        @click="saveSvgFiles"
                        class="btn btn-primary"
                        :disabled="!hasSvgFiles || uploading"
                    >
                        {{ uploading ? 'Uploading...' : 'Save SVG Files' }}
                    </button>
                    <button
                        @click="$emit('close')"
                        class="btn btn-outline"
                    >
                        Close
                    </button>
                </div>
            </div>

            <!-- Hidden file inputs -->
            <input
                ref="decorInput"
                type="file"
                accept=".svg"
                style="display: none"
                @change="handleFileSelect($event, 'decor')"
            />
            <input
                ref="monitorInput"
                type="file"
                accept=".svg"
                style="display: none"
                @change="handleFileSelect($event, 'monitor')"
            />
            <input
                ref="screenInput"
                type="file"
                accept=".svg"
                style="display: none"
                @change="handleFileSelect($event, 'screen')"
            />
        </div>
    </div>

    <!-- Image Preview Modal -->
    <div
        v-if="previewImage"
        class="image-preview-overlay"
        @click="previewImage = null"
    >
        <div
            class="image-preview-content"
            @click.stop
        >
            <img
                :src="previewImage"
                alt="Full size preview"
            />
            <button
                @click="previewImage = null"
                class="preview-close"
            >&times;</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase.js';

// ==========================================
// PROPS & EMITS
// ==========================================

const props = defineProps({
    submission: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close', 'status-updated']);

// ==========================================
// REACTIVE STATE
// ==========================================

const decorSvg = ref(null);
const monitorSvg = ref(null);
const screenSvg = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const previewImage = ref(null);

// Template refs
const decorInput = ref(null);
const monitorInput = ref(null);
const screenInput = ref(null);

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

const currentStatus = computed(() => {
    return props.submission.desk_submissions?.[0]?.status || 'unknown';
});

const hasSocialLinks = computed(() => {
    return props.submission.social_facebook ||
        props.submission.social_twitter ||
        props.submission.social_linkedin ||
        props.submission.social_website;
});

const hasSvgFiles = computed(() => {
    return decorSvg.value || monitorSvg.value || screenSvg.value;
});

// ==========================================
// FILE HANDLING
// ==========================================

function triggerFileInput(type) {
    const inputs = {
        decor: decorInput.value,
        monitor: monitorInput.value,
        screen: screenInput.value
    };

    inputs[type]?.click();
}

function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
        setFile(type, file);
    } else {
        alert('Please select a valid SVG file');
    }
}

function handleDrop(event, type) {
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'image/svg+xml') {
            setFile(type, file);
        } else {
            alert('Please drop a valid SVG file');
        }
    }
}

function setFile(type, file) {
    switch (type) {
        case 'decor':
            decorSvg.value = file;
            break;
        case 'monitor':
            monitorSvg.value = file;
            break;
        case 'screen':
            screenSvg.value = file;
            break;
    }
}

function removeFile(type) {
    switch (type) {
        case 'decor':
            decorSvg.value = null;
            break;
        case 'monitor':
            monitorSvg.value = null;
            break;
        case 'screen':
            screenSvg.value = null;
            break;
    }
}

// ==========================================
// SVG UPLOAD
// ==========================================

async function saveSvgFiles() {
    if (!hasSvgFiles.value) return;

    uploading.value = true;
    uploadProgress.value = 0;

    try {
        const updates = {};
        let completed = 0;
        const totalFiles = [decorSvg.value, monitorSvg.value, screenSvg.value].filter(Boolean).length;

        // Upload decoration SVG
        if (decorSvg.value) {
            const decorPath = `${props.submission.id}/decor-${Date.now()}.svg`;
            const { data, error } = await supabase.storage
                .from('desk-decor')
                .upload(decorPath, decorSvg.value);

            if (!error) {
                const { data: urlData } = supabase.storage
                    .from('desk-decor')
                    .getPublicUrl(data.path);
                updates.decor_svg_url = urlData.publicUrl;
            }

            completed++;
            uploadProgress.value = Math.round((completed / totalFiles) * 100);
        }

        // Upload monitor SVG
        if (monitorSvg.value) {
            const monitorPath = `${props.submission.id}/monitor-${Date.now()}.svg`;
            const { data, error } = await supabase.storage
                .from('desk-monitors')
                .upload(monitorPath, monitorSvg.value);

            if (!error) {
                const { data: urlData } = supabase.storage
                    .from('desk-monitors')
                    .getPublicUrl(data.path);
                updates.monitor_config = urlData.publicUrl;
            }

            completed++;
            uploadProgress.value = Math.round((completed / totalFiles) * 100);
        }

        // Upload screen SVG
        if (screenSvg.value) {
            const screenPath = `${props.submission.id}/screen-${Date.now()}.svg`;
            const { data, error } = await supabase.storage
                .from('desk-screens')
                .upload(screenPath, screenSvg.value);

            if (!error) {
                const { data: urlData } = supabase.storage
                    .from('desk-screens')
                    .getPublicUrl(data.path);
                updates.screen_config = urlData.publicUrl;
            }

            completed++;
            uploadProgress.value = Math.round((completed / totalFiles) * 100);
        }

        // Update desk record with SVG URLs
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('desks')
                .update(updates)
                .eq('id', props.submission.id);

            if (updateError) {
                throw updateError;
            }

            alert('SVG files uploaded successfully!');

            // Clear the files
            decorSvg.value = null;
            monitorSvg.value = null;
            screenSvg.value = null;
        }

    } catch (error) {
        console.error('Error uploading SVG files:', error);
        alert('Failed to upload SVG files');
    } finally {
        uploading.value = false;
        uploadProgress.value = 0;
    }
}

// ==========================================
// STATUS UPDATES
// ==========================================

async function updateSubmissionStatus(status) {
    try {
        const { error } = await supabase
            .from('desk_submissions')
            .update({ status })
            .eq('desk_id', props.submission.id);

        if (error) throw error;

        emit('status-updated');
        alert(`Status updated to ${status}`);
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
}

async function updateDeskStatus(status) {
    const confirmMessage = status === 'approved'
        ? 'Are you sure you want to approve this desk?'
        : 'Are you sure you want to reject this desk?';

    if (!confirm(confirmMessage)) return;

    try {
        const updates = { status };

        if (status === 'approved') {
            updates.approved_at = new Date().toISOString();
            updates.approved_by = 'admin'; // You can add proper user management later
        }

        const { error } = await supabase
            .from('desks')
            .update(updates)
            .eq('id', props.submission.id);

        if (error) throw error;

        emit('status-updated');
        alert(`Desk ${status} successfully!`);
        emit('close');
    } catch (error) {
        console.error('Error updating desk status:', error);
        alert('Failed to update desk status');
    }
}

// ==========================================
// IMAGE PREVIEW
// ==========================================

function openImagePreview(imageUrl) {
    previewImage.value = imageUrl;
}

// ==========================================
// UTILITIES
// ==========================================

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<style scoped lang="scss">
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.modal-content {
    background: white;
    border-radius: 8px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e1e5e9;

    h2 {
        margin: 0;
        color: #1a1a1a;
        font-size: 1.3rem;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            color: #333;
        }
    }
}

.modal-body {
    padding: 2rem;
}

.detail-section {
    margin-bottom: 2rem;

    h3 {
        margin: 0 0 1rem 0;
        color: #1a1a1a;
        font-size: 1.1rem;
        font-weight: 600;
        border-bottom: 2px solid #f1f3f4;
        padding-bottom: 0.5rem;
    }

    h4 {
        margin: 1rem 0 0.5rem 0;
        color: #333;
        font-size: 0.95rem;
        font-weight: 600;
    }
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
        font-weight: 600;
        color: #666;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    span {
        color: #1a1a1a;
        font-size: 0.95rem;
    }
}

.social-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;

    a {
        padding: 0.5rem 1rem;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 20px;
        text-decoration: none;
        color: #007bff;
        font-size: 0.85rem;
        transition: all 0.2s;

        &:hover {
            background: #007bff;
            color: white;
        }
    }
}

.image-section {
    margin-bottom: 1.5rem;
}

.image-container {
    .profile-image {
        width: 150px;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #e1e5e9;
    }
}

.desk-photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.photo-container {
    .desk-photo {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #e1e5e9;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.02);
        }
    }
}

.svg-upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
}

.svg-upload-area {
    .upload-zone {
        border: 2px dashed #ddd;
        border-radius: 8px;
        padding: 2rem 1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            border-color: #007bff;
            background: #f8f9ff;
        }

        &.has-file {
            border-color: #28a745;
            background: #f8fff9;
        }

        .upload-placeholder {
            color: #666;
            font-size: 0.9rem;
        }

        .uploaded-file {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            color: #28a745;
            font-weight: 500;

            .remove-btn {
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                    background: #c82333;
                }
            }
        }
    }
}

.upload-progress {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
    text-align: center;
    color: #007bff;
    font-weight: 500;
}

.modal-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid #e1e5e9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.status-buttons,
.action-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &.btn-primary {
        background: #007bff;
        color: white;

        &:hover:not(:disabled) {
            background: #0056b3;
        }
    }

    &.btn-secondary {
        background: #6c757d;
        color: white;

        &:hover:not(:disabled) {
            background: #545b62;
        }
    }

    &.btn-success {
        background: #28a745;
        color: white;

        &:hover:not(:disabled) {
            background: #1e7e34;
        }
    }

    &.btn-danger {
        background: #dc3545;
        color: white;

        &:hover:not(:disabled) {
            background: #c82333;
        }
    }

    &.btn-outline {
        background: transparent;
        border: 1px solid #ddd;
        color: #666;

        &:hover {
            background: #f8f9fa;
        }
    }
}

// Image Preview Modal
.image-preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 2rem;
}

.image-preview-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;

    img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
    }

    .preview-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;

        &:hover {
            background: #f8f9fa;
        }
    }
}
</style>
