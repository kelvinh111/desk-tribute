<template>
    <div class="desk-submission-form">
        <h2>Submit Your Desk</h2>
        <p class="subtitle">SHARE YOUR CREATIVE SPACE</p>

        <form
            @submit.prevent="handleSubmit"
            class="form"
        >
            <!-- Personal Information Section -->
            <div class="form-section">
                <div class="form-row">
                    <div class="form-group">
                        <label for="fullName">Full Name <span class="required">*</span></label>
                        <input
                            id="fullName"
                            v-model="formData.fullName"
                            type="text"
                            class="form-input"
                            :class="{ 'error': errors.fullName }"
                            placeholder="Enter your full name"
                            required
                        />
                        <span
                            v-if="errors.fullName"
                            class="error-message"
                        >{{ errors.fullName }}</span>
                    </div>

                    <div class="form-group">
                        <label for="email">E-mail <span class="required">*</span></label>
                        <input
                            id="email"
                            v-model="formData.email"
                            type="email"
                            class="form-input"
                            :class="{ 'error': errors.email }"
                            placeholder="your.email@example.com"
                            required
                        />
                        <span
                            v-if="errors.email"
                            class="error-message"
                        >{{ errors.email }}</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="jobTitle">Job Title <span class="required">*</span></label>
                        <input
                            id="jobTitle"
                            v-model="formData.jobTitle"
                            type="text"
                            class="form-input"
                            :class="{ 'error': errors.jobTitle }"
                            placeholder="e.g. UI/UX Designer"
                            required
                        />
                        <span
                            v-if="errors.jobTitle"
                            class="error-message"
                        >{{ errors.jobTitle }}</span>
                    </div>

                    <div class="form-group">
                        <label for="city">City <span class="required">*</span></label>
                        <input
                            id="city"
                            v-model="formData.city"
                            type="text"
                            class="form-input"
                            :class="{ 'error': errors.city }"
                            placeholder="e.g. New York"
                            required
                        />
                        <span
                            v-if="errors.city"
                            class="error-message"
                        >{{ errors.city }}</span>
                    </div>
                </div>
            </div>

            <!-- Social Media Section -->
            <div class="form-section">
                <div class="form-row">
                    <div class="form-group">
                        <label for="facebook">Facebook</label>
                        <input
                            id="facebook"
                            v-model="formData.facebook"
                            type="url"
                            class="form-input"
                            placeholder="https://facebook.com/yourprofile"
                        />
                    </div>

                    <div class="form-group">
                        <label for="twitter">Twitter</label>
                        <input
                            id="twitter"
                            v-model="formData.twitter"
                            type="url"
                            class="form-input"
                            placeholder="https://twitter.com/yourhandle"
                        />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="google">Google +</label>
                        <input
                            id="google"
                            v-model="formData.google"
                            type="url"
                            class="form-input"
                            placeholder="https://plus.google.com/yourprofile"
                        />
                    </div>

                    <div class="form-group">
                        <label for="website">Blog / Website</label>
                        <input
                            id="website"
                            v-model="formData.website"
                            type="url"
                            class="form-input"
                            placeholder="https://yourwebsite.com"
                        />
                    </div>
                </div>
            </div>

            <!-- Image Upload Section -->
            <div class="form-section">
                <div class="image-upload-section">
                    <!-- Profile Picture -->
                    <div class="upload-group">
                        <label>Profile Picture <span class="required">*</span></label>
                        <div class="upload-container">
                            <div
                                class="upload-box"
                                :class="{ 'has-image': formData.profilePicture, 'error': errors.profilePicture }"
                                @click="triggerFileInput('profilePicture')"
                                @dragover.prevent
                                @drop.prevent="handleDrop($event, 'profilePicture')"
                            >
                                <div
                                    v-if="!formData.profilePicture"
                                    class="upload-placeholder"
                                >
                                    <div class="upload-icon">📷</div>
                                    <div class="upload-text">UPLOAD IMAGE</div>
                                    <div class="upload-specs">W: 300PX, H: 200PX<br />72DPI, JPEG</div>
                                </div>
                                <div
                                    v-else
                                    class="uploaded-image"
                                >
                                    <img
                                        :src="profilePicturePreview"
                                        alt="Profile preview"
                                    />
                                    <button
                                        type="button"
                                        class="remove-image"
                                        @click.stop="removeImage('profilePicture')"
                                    >×</button>
                                </div>
                            </div>
                            <span
                                v-if="errors.profilePicture"
                                class="error-message"
                            >{{ errors.profilePicture }}</span>
                        </div>
                    </div>

                    <!-- Desk Pictures -->
                    <div class="upload-group">
                        <label>Desk Picture <span class="required">*</span></label>
                        <div class="desk-upload-grid">
                            <div
                                v-for="(image, index) in formData.deskPictures"
                                :key="index"
                                class="upload-box"
                                :class="{ 'has-image': image, 'error': errors[`deskPicture${index}`] }"
                                @click="triggerFileInput(`deskPicture${index}`)"
                                @dragover.prevent
                                @drop.prevent="handleDrop($event, `deskPicture${index}`)"
                            >
                                <div
                                    v-if="!image"
                                    class="upload-placeholder"
                                >
                                    <div class="upload-icon">📷</div>
                                    <div class="upload-text">UPLOAD IMAGE</div>
                                    <div class="upload-specs">W: 1200PX, H: 600PX = 1200PX<br />72DPI, JPEG</div>
                                </div>
                                <div
                                    v-else
                                    class="uploaded-image"
                                >
                                    <img
                                        :src="getDeskImagePreview(index)"
                                        alt="Desk preview"
                                    />
                                    <button
                                        type="button"
                                        class="remove-image"
                                        @click.stop="removeImage(`deskPicture${index}`)"
                                    >×</button>
                                </div>
                            </div>
                        </div>
                        <span
                            v-if="errors.deskPictures"
                            class="error-message"
                        >{{ errors.deskPictures }}</span>
                    </div>
                </div>
            </div>

            <!-- Terms and Actions -->
            <div class="form-section">
                <div class="terms-section">
                    <label class="checkbox-container">
                        <input
                            v-model="formData.agreeToTerms"
                            type="checkbox"
                            class="checkbox"
                            :class="{ 'error': errors.agreeToTerms }"
                            required
                        />
                        <span class="checkmark"></span>
                        I agree with the
                        <a
                            href="#"
                            class="terms-link"
                            @click.prevent="showTerms"
                        >Terms and Conditions</a>
                        <span class="required">*</span>
                    </label>
                    <span
                        v-if="errors.agreeToTerms"
                        class="error-message"
                    >{{ errors.agreeToTerms }}</span>
                </div>

                <div class="action-buttons">
                    <button
                        type="button"
                        class="btn btn-cancel"
                        @click="handleCancel"
                        :disabled="isSubmitting"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        class="btn btn-submit"
                        :disabled="isSubmitting || !isFormValid"
                    >
                        {{ isSubmitting ? 'SUBMITTING...' : 'SUBMIT' }}
                    </button>
                </div>
            </div>
        </form>

        <!-- Hidden file inputs -->
        <input
            ref="profilePictureInput"
            type="file"
            accept=".jpg,.jpeg,.png"
            style="display: none"
            @change="handleFileSelect($event, 'profilePicture')"
        />
        <input
            v-for="index in 6"
            :key="index"
            :ref="el => deskPictureInputs[index - 1] = el"
            type="file"
            accept=".jpg,.jpeg,.png"
            style="display: none"
            @change="handleFileSelect($event, `deskPicture${index - 1}`)"
        />
    </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { audioManager } from '../utils/audioManager.js';

/**
 * Desk Submission Form Component
 * 
 * Comprehensive form for users to submit their desk setup information including:
 * - Personal information (name, email, job title, city)
 * - Social media links (optional)
 * - Profile picture and desk images with validation
 * - Terms and conditions agreement
 * 
 * Features:
 * - Image format validation (JPG/PNG only)
 * - Drag & drop image upload
 * - Image dimension validation
 * - Real-time form validation
 * - Audio feedback for interactions
 */

// ==========================================
// COMPONENT PROPS & EMITS
// ==========================================

const emit = defineEmits(['close', 'submit']);

// ==========================================
// TEMPLATE REFS
// ==========================================

/** @type {import('vue').Ref} Profile picture file input ref */
const profilePictureInput = ref(null);

/** @type {Array<import('vue').Ref>} Desk picture file input refs */
const deskPictureInputs = [];
for (let i = 0; i < 6; i++) {
    deskPictureInputs[i] = ref(null);
}

// ==========================================
// FORM STATE MANAGEMENT
// ==========================================

/** @type {Object} Main form data object */
const formData = reactive({
    // Personal Information
    fullName: '',
    email: '',
    jobTitle: '',
    city: '',

    // Social Media (Optional)
    facebook: '',
    twitter: '',
    google: '',
    website: '',

    // Images
    profilePicture: null,
    deskPictures: new Array(6).fill(null), // 6 desk image slots

    // Terms
    agreeToTerms: false
});

/** @type {Object} Form validation errors */
const errors = reactive({});

/** @type {import('vue').Ref<boolean>} Submission state */
const isSubmitting = ref(false);

/** @type {Object} Image preview URLs for display */
const imagePreviews = reactive({
    profilePicture: null,
    deskPictures: new Array(6).fill(null)
});

// ==========================================
// IMAGE VALIDATION CONSTANTS
// ==========================================

/** @type {Array<string>} Accepted image formats */
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

/** @type {number} Maximum file size in bytes (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** @type {Object} Required image dimensions */
const IMAGE_REQUIREMENTS = {
    profilePicture: { width: 300, height: 200 },
    deskPicture: { width: 1200, height: 600 }
};

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

/**
 * Check if the form is valid for submission
 * @returns {boolean} True if all required fields are valid
 */
const isFormValid = computed(() => {
    return formData.fullName &&
        formData.email &&
        formData.jobTitle &&
        formData.city &&
        formData.profilePicture &&
        formData.deskPictures.some(img => img !== null) &&
        formData.agreeToTerms &&
        Object.keys(errors).length === 0;
});

/**
 * Get profile picture preview URL
 * @returns {string|null} Preview URL or null
 */
const profilePicturePreview = computed(() => {
    return imagePreviews.profilePicture;
});

// ==========================================
// IMAGE HANDLING METHODS
// ==========================================

/**
 * Trigger file input for specific image type
 * @param {string} imageType - Type of image (profilePicture, deskPicture0, etc.)
 */
function triggerFileInput(imageType) {
    audioManager.play('photoviewer_click');

    if (imageType === 'profilePicture') {
        profilePictureInput.value?.click();
    } else {
        const index = parseInt(imageType.replace('deskPicture', ''));
        deskPictureInputs[index]?.value?.click();
    }
}

/**
 * Handle file selection from input
 * @param {Event} event - File input change event
 * @param {string} imageType - Type of image being uploaded
 */
async function handleFileSelect(event, imageType) {
    const file = event.target.files[0];
    if (file) {
        await processImageFile(file, imageType);
    }
}

/**
 * Handle drag and drop file upload
 * @param {DragEvent} event - Drop event
 * @param {string} imageType - Type of image being uploaded
 */
async function handleDrop(event, imageType) {
    audioManager.play('photoviewer_click');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        await processImageFile(files[0], imageType);
    }
}

/**
 * Process and validate uploaded image file
 * @param {File} file - Uploaded file
 * @param {string} imageType - Type of image being processed
 */
async function processImageFile(file, imageType) {
    // Clear previous errors
    clearError(imageType);

    try {
        // Validate file format
        if (!ACCEPTED_FORMATS.includes(file.type)) {
            setError(imageType, 'Only JPG and PNG formats are accepted');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError(imageType, 'File size must be less than 5MB');
            return;
        }

        // Validate image dimensions
        const isValidDimensions = await validateImageDimensions(file, imageType);
        if (!isValidDimensions) {
            return; // Error already set in validateImageDimensions
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        // Store file and preview
        if (imageType === 'profilePicture') {
            formData.profilePicture = file;
            imagePreviews.profilePicture = previewUrl;
        } else {
            const index = parseInt(imageType.replace('deskPicture', ''));
            formData.deskPictures[index] = file;
            imagePreviews.deskPictures[index] = previewUrl;
        }

        audioManager.play('photoviewer_load');

    } catch (error) {
        console.error('Error processing image:', error);
        setError(imageType, 'Failed to process image. Please try again.');
    }
}

/**
 * Validate image dimensions
 * @param {File} file - Image file to validate
 * @param {string} imageType - Type of image
 * @returns {Promise<boolean>} True if dimensions are valid
 */
function validateImageDimensions(file, imageType) {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            const requirements = imageType === 'profilePicture'
                ? IMAGE_REQUIREMENTS.profilePicture
                : IMAGE_REQUIREMENTS.deskPicture;

            if (img.width !== requirements.width || img.height !== requirements.height) {
                setError(imageType,
                    `Image must be exactly ${requirements.width}x${requirements.height} pixels`
                );
                resolve(false);
            } else {
                resolve(true);
            }

            URL.revokeObjectURL(img.src);
        };

        img.onerror = () => {
            setError(imageType, 'Invalid image file');
            resolve(false);
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Remove uploaded image
 * @param {string} imageType - Type of image to remove
 */
function removeImage(imageType) {
    audioManager.play('photoviewer_click');

    if (imageType === 'profilePicture') {
        formData.profilePicture = null;
        if (imagePreviews.profilePicture) {
            URL.revokeObjectURL(imagePreviews.profilePicture);
            imagePreviews.profilePicture = null;
        }
    } else {
        const index = parseInt(imageType.replace('deskPicture', ''));
        formData.deskPictures[index] = null;
        if (imagePreviews.deskPictures[index]) {
            URL.revokeObjectURL(imagePreviews.deskPictures[index]);
            imagePreviews.deskPictures[index] = null;
        }
    }

    clearError(imageType);
}

/**
 * Get desk image preview URL by index
 * @param {number} index - Index of desk image
 * @returns {string|null} Preview URL or null
 */
function getDeskImagePreview(index) {
    return imagePreviews.deskPictures[index];
}

// ==========================================
// VALIDATION METHODS
// ==========================================

/**
 * Set validation error for a field
 * @param {string} field - Field name
 * @param {string} message - Error message
 */
function setError(field, message) {
    errors[field] = message;
}

/**
 * Clear validation error for a field
 * @param {string} field - Field name
 */
function clearError(field) {
    delete errors[field];
}

/**
 * Validate entire form
 * @returns {boolean} True if form is valid
 */
function validateForm() {
    const newErrors = {};

    // Required field validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.profilePicture) newErrors.profilePicture = 'Profile picture is required';
    if (!formData.deskPictures.some(img => img !== null)) {
        newErrors.deskPictures = 'At least one desk picture is required';
    }
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';

    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
    }

    // Update errors
    Object.keys(errors).forEach(key => delete errors[key]);
    Object.assign(errors, newErrors);

    return Object.keys(newErrors).length === 0;
}

// ==========================================
// FORM ACTIONS
// ==========================================

/**
 * Handle form submission
 */
async function handleSubmit() {
    audioManager.play('photoviewer_click');

    if (!validateForm()) {
        audioManager.play('gallery_hover'); // Error sound
        return;
    }

    isSubmitting.value = true;

    try {
        // Create FormData for file upload
        const submitData = new FormData();

        // Add text fields
        Object.keys(formData).forEach(key => {
            if (key !== 'profilePicture' && key !== 'deskPictures') {
                submitData.append(key, formData[key]);
            }
        });

        // Add profile picture
        if (formData.profilePicture) {
            submitData.append('profilePicture', formData.profilePicture);
        }

        // Add desk pictures
        formData.deskPictures.forEach((file, index) => {
            if (file) {
                submitData.append(`deskPicture${index}`, file);
            }
        });

        // Emit submission event with form data
        emit('submit', submitData);

        audioManager.play('photoviewer_load'); // Success sound

        // Close form after successful submission
        setTimeout(() => {
            emit('close');
        }, 1000); // Brief delay to show success state

    } catch (error) {
        console.error('Submission error:', error);
        audioManager.play('gallery_hover'); // Error sound
    } finally {
        isSubmitting.value = false;
    }
}

/**
 * Handle form cancellation
 */
function handleCancel() {
    audioManager.play('photoviewer_click');

    // Clean up image previews
    if (imagePreviews.profilePicture) {
        URL.revokeObjectURL(imagePreviews.profilePicture);
    }
    imagePreviews.deskPictures.forEach(url => {
        if (url) URL.revokeObjectURL(url);
    });

    emit('close');
}

/**
 * Show terms and conditions
 */
function showTerms() {
    audioManager.play('header_click');
    // TODO: Implement terms modal or navigation
    alert('Terms and Conditions will be displayed here');
}
</script>

<style scoped lang="scss">
.desk-submission-form {
    max-width: 800px;
    width: 100%;
    color: white;
}

h2 {
    font-size: 2.5rem;
    font-weight: normal;
    margin-bottom: 0.5rem;
    letter-spacing: 2px;
    text-align: center;
}

.subtitle {
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 3px;
    color: #999;
    margin-bottom: 3rem;
    text-align: center;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #ccc;
}

.required {
    color: #ff6b6b;
}

.form-input {
    padding: 0.8rem 1rem;
    border: 2px solid #555;
    border-radius: 4px;
    background: #333;
    color: white;
    font-size: 1rem;
    transition: border-color 0.3s ease;

    &:focus {
        outline: none;
        border-color: #667eea;
    }

    &.error {
        border-color: #ff6b6b;
    }

    &::placeholder {
        color: #888;
    }
}

.error-message {
    font-size: 0.8rem;
    color: #ff6b6b;
    margin-top: 0.25rem;
}

// ==========================================
// IMAGE UPLOAD STYLES
// ==========================================

.image-upload-section {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
}

.upload-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.upload-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.desk-upload-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
    }
}

.upload-box {
    aspect-ratio: 3/2;
    border: 2px dashed #555;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
    }

    &.has-image {
        border-style: solid;
        border-color: #667eea;
    }

    &.error {
        border-color: #ff6b6b;
    }
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
    padding: 1rem;
}

.upload-icon {
    font-size: 2rem;
    opacity: 0.6;
}

.upload-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: #667eea;
}

.upload-specs {
    font-size: 0.7rem;
    color: #888;
    line-height: 1.3;
}

.uploaded-image {
    width: 100%;
    height: 100%;
    position: relative;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .remove-image {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 2rem;
        height: 2rem;
        border: none;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s ease;

        &:hover {
            background: rgba(255, 107, 107, 0.8);
        }
    }
}

// ==========================================
// TERMS AND ACTIONS
// ==========================================

.terms-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
}

.checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1.4;
}

.checkbox {
    display: none;
}

.checkmark {
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid #555;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    margin-top: 0.1rem;

    &::after {
        content: '✓';
        color: white;
        font-size: 0.9rem;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
}

.checkbox:checked+.checkmark {
    background: #667eea;
    border-color: #667eea;

    &::after {
        opacity: 1;
    }
}

.checkbox.error+.checkmark {
    border-color: #ff6b6b;
}

.terms-link {
    color: #667eea;
    text-decoration: underline;

    &:hover {
        color: #5a6fd8;
    }
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
}

.btn {
    padding: 0.8rem 2rem;
    border: 2px solid transparent;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.btn-cancel {
    background: transparent;
    border-color: #666;
    color: #ccc;

    &:hover:not(:disabled) {
        border-color: #888;
        color: white;
    }
}

.btn-submit {
    background: #667eea;
    color: white;

    &:hover:not(:disabled) {
        background: #5a6fd8;
    }

    &:disabled {
        background: #555;
    }
}
</style>
