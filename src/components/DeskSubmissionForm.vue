<template>
    <div class="desk-submission-form">
        <h2>Submit Your Desk</h2>

        <form
            @submit.prevent="handleSubmit"
            class="form"
            novalidate
        >
            <!-- Personal Information Section -->
            <div class="form-section basic-fields">
                <div class="form-field">
                    <label for="fullName">Full Name <span class="required">*</span></label>
                    <input
                        id="fullName"
                        v-model="formData.fullName"
                        type="text"
                        class="form-input"
                        :class="{ 'error': errors.fullName }"
                    />
                </div>

                <div class="form-field">
                    <label for="email">E-mail <span class="required">*</span></label>
                    <input
                        id="email"
                        v-model="formData.email"
                        type="email"
                        class="form-input"
                        :class="{ 'error': errors.email }"
                    />
                </div>

                <div class="form-field">
                    <label for="jobTitle">Job Title <span class="required">*</span></label>
                    <input
                        id="jobTitle"
                        v-model="formData.jobTitle"
                        type="text"
                        class="form-input"
                        :class="{ 'error': errors.jobTitle }"
                    />
                </div>

                <div class="form-field">
                    <label for="city">City <span class="required">*</span></label>
                    <input
                        id="city"
                        v-model="formData.city"
                        type="text"
                        class="form-input"
                        :class="{ 'error': errors.city }"
                    />
                </div>
            </div>

            <!-- Social Media Section -->
            <div class="form-section sns-fields">
                <div class="form-field">
                    <label for="facebook">Facebook</label>
                    <input
                        id="facebook"
                        v-model="formData.facebook"
                        type="url"
                        class="form-input"
                    />
                </div>

                <div class="form-field">
                    <label for="twitter">X</label>
                    <input
                        id="twitter"
                        v-model="formData.twitter"
                        type="url"
                        class="form-input"
                    />
                </div>
                <div class="form-field">
                    <label for="linkedin">LinkedIn</label>
                    <input
                        id="linkedin"
                        v-model="formData.linkedin"
                        type="url"
                        class="form-input"
                    />
                </div>

                <div class="form-field">
                    <label for="website">Blog / Website</label>
                    <input
                        id="website"
                        v-model="formData.website"
                        type="url"
                        class="form-input"
                    />
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
                                    <div class="upload-text">UPLOAD IMAGE</div>
                                    <!-- <div class="upload-specs">W: 300PX, H: 200PX<br />72DPI, JPEG</div> -->
                                </div>
                                <div
                                    v-else
                                    class="uploaded-image"
                                >
                                    <img
                                        :src="profilePicturePreview"
                                        alt="Profile preview"
                                    />
                                    <!-- <button
                                        type="button"
                                        class="remove-image"
                                        @click.stop="removeImage('profilePicture')"
                                    >×</button> -->
                                </div>
                            </div>
                            <div class="upload-specs"><small>W: 300PX, H: 200PX<br />72DPI, JPEG</small></div>
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
                                    <div class="upload-text">UPLOAD IMAGE</div>
                                </div>
                                <div
                                    v-else
                                    class="uploaded-image"
                                >
                                    <img
                                        :src="getDeskImagePreview(index)"
                                        alt="Desk preview"
                                    />
                                    <!-- <button
                                        type="button"
                                        class="remove-image"
                                        @click.stop="removeImage(`deskPicture${index}`)"
                                    >×</button> -->
                                </div>
                            </div>
                        </div>
                        <div class="upload-specs"><small>W: 1200PX, H: 600PX ~ 1200PX<br />72DPI, JPEG</small></div>
                    </div>
                </div>
            </div>

            <!-- Terms and Actions -->
            <div class="terms-section">
                <label
                    class="checkbox-container"
                    :class="{ 'error': errors.agreeToTerms }"
                >
                    <input
                        v-model="formData.agreeToTerms"
                        type="checkbox"
                        class="checkbox"
                        :class="{ 'error': errors.agreeToTerms }"
                    />
                    <span class="checkmark"></span>
                    I agree with the
                    <a
                        href="#"
                        class="terms-link"
                        @click.prevent="showTerms"
                        @mouseenter="showTooltip = true"
                        @mouseleave="showTooltip = false"
                    >Terms and Conditions</a>
                    <span class="required">*</span>
                </label>

                <!-- Terms and Conditions Tooltip -->
                <div
                    v-if="showTooltip"
                    class="terms-tooltip"
                >
                    <div class="tooltip-content">
                        <h3>Terms and Conditions</h3>
                        <ol>
                            <li>Your pictures must be your original creation and must not infringe the intellectual
                                property rights (including but not limited to moral rights) of any third party anywhere
                                in the world.</li>
                            <li>The pictures must be suitable for a person of any age to view and must comply with all
                                relevant law, regulations and codes.</li>
                            <li>DESK can publish pictures of the submitted desk on desk.cmbcm.com and Apps for mobile
                                devices.</li>
                            <li>DESK can publish pictures of the submitted desk in future DESK offline Posters and
                                Books.</li>
                        </ol>
                    </div>
                    <div class="tooltip-arrow"></div>
                </div>
            </div>

            <div class="action-buttons">
                <button
                    type="submit"
                    class="btn btn-submit"
                    :disabled="isSubmitting"
                >
                    {{ isSubmitting ? 'SUBMITTING...' : 'SUBMIT' }}
                </button>
                <button
                    type="button"
                    class="btn btn-cancel"
                    @click="handleCancel"
                    :disabled="isSubmitting"
                >
                    CANCEL
                </button>
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
            v-for="index in 5"
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
import { ref, computed, reactive, watch } from 'vue';
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

/** @type {Array} Desk picture file input refs */
const deskPictureInputs = reactive([]);

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
    linkedin: '',
    website: '',

    // Images
    profilePicture: null,
    deskPictures: new Array(5).fill(null), // 5 desk image slots

    // Terms
    agreeToTerms: false
});

/** @type {Object} Form validation errors */
const errors = reactive({});

/** @type {import('vue').Ref<boolean>} Submission state */
const isSubmitting = ref(false);

/** @type {import('vue').Ref<boolean>} Tooltip visibility state */
const showTooltip = ref(false);

/** @type {Object} Image preview URLs for display */
const imagePreviews = reactive({
    profilePicture: null,
    deskPictures: new Array(5).fill(null)
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
    deskPicture: { width: 1200, minHeight: 600, maxHeight: 1200 }
};

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

/**
 * Get profile picture preview URL
 * @returns {string|null} Preview URL or null
 */
const profilePicturePreview = computed(() => {
    return imagePreviews.profilePicture;
});

// ==========================================
// REACTIVE ERROR CLEARING
// ==========================================

// Watch for changes in form fields and clear errors when fixed
watch(() => formData.fullName, (newVal) => {
    if (newVal && newVal.trim() && errors.fullName) {
        clearError('fullName');
    }
});

watch(() => formData.email, (newVal) => {
    if (newVal && newVal.trim() && errors.email) {
        // Basic email validation to clear error
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVal)) {
            clearError('email');
        }
    }
});

watch(() => formData.jobTitle, (newVal) => {
    if (newVal && newVal.trim() && errors.jobTitle) {
        clearError('jobTitle');
    }
});

watch(() => formData.city, (newVal) => {
    if (newVal && newVal.trim() && errors.city) {
        clearError('city');
    }
});

watch(() => formData.profilePicture, (newVal) => {
    if (newVal && errors.profilePicture) {
        clearError('profilePicture');
    }
});

watch(() => formData.deskPictures, (newVal) => {
    if (newVal.some(img => img !== null) && errors.deskPictures) {
        clearError('deskPictures');
    }
    // Clear individual desk picture errors
    newVal.forEach((img, index) => {
        if (img && errors[`deskPicture${index}`]) {
            clearError(`deskPicture${index}`);
        }
    });
}, { deep: true });

watch(() => formData.agreeToTerms, (newVal) => {
    if (newVal && errors.agreeToTerms) {
        clearError('agreeToTerms');
    }
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
        deskPictureInputs[index]?.click();
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

            if (imageType === 'profilePicture') {
                // Profile picture needs exact dimensions
                if (img.width !== requirements.width || img.height !== requirements.height) {
                    setError(imageType,
                        `Image must be exactly ${requirements.width}x${requirements.height} pixels`
                    );
                    resolve(false);
                } else {
                    resolve(true);
                }
            } else {
                // Desk picture needs exact width but height within range
                if (img.width !== requirements.width) {
                    setError(imageType,
                        `Image width must be exactly ${requirements.width} pixels`
                    );
                    resolve(false);
                } else if (img.height < requirements.minHeight || img.height > requirements.maxHeight) {
                    setError(imageType,
                        `Image height must be between ${requirements.minHeight} and ${requirements.maxHeight} pixels`
                    );
                    resolve(false);
                } else {
                    resolve(true);
                }
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
        // Also set error on first empty desk picture box for visual feedback
        const firstEmptyIndex = formData.deskPictures.findIndex(img => img === null);
        if (firstEmptyIndex !== -1) {
            newErrors[`deskPicture${firstEmptyIndex}`] = 'Desk picture is required';
        }
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

    // Always run validation and set error states
    const isValid = validateForm();

    if (!isValid) {
        audioManager.play('gallery_hover'); // Error sound
        return; // Stop submission but errors are now visible
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

        // Debug: Log FormData contents
        console.log('Submitting form data:');
        for (let [key, value] of submitData.entries()) {
            if (value instanceof File) {
                console.log(`${key}:`, `File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else {
                console.log(`${key}:`, value);
            }
        }

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
    width: 600px;
    color: #666;
    text-align: left;
}

h2 {
    font-size: 2.3rem;
    font-weight: 200;
    margin-bottom: 2rem;
    color: #fff;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

// ==========================================
// FORM SECTIONS
// ==========================================

.form-section {
    display: flex;
    width: 100%;
    gap: 15px 20px;

    &.basic-fields {
        flex-wrap: wrap;

        .form-field {
            width: calc(50% - 10px);
        }
    }

    &.sns-fields {
        flex-wrap: nowrap;

        .form-field {
            width: 25%;
        }
    }
}

// ==========================================
// FORM INPUTS & LABELS
// ==========================================

.form-field {

    // Error state for form fields
    &:has(.form-input.error) {
        label {
            color: #ee1100 !important;
        }
    }
}

label {
    display: block;
    margin-bottom: 0.25rem;
    color: #666;
    font-size: 0.85rem;
    transition: color 0.6s ease;

    &:has(+ .form-input:focus) {
        color: white !important;
    }
}

.form-input {
    padding: 0.5rem;
    display: block;
    width: 100%;
    border: none;
    border-radius: 0;
    background-color: #666;
    transition: background-color 0.6s ease;
    outline: none;

    &:focus {
        background-color: white !important;
    }

    &.error {
        background-color: #ee1100 !important;
    }

    &::placeholder {
        color: #888;
    }
}

// ==========================================
// SOCIAL MEDIA FIELDS
// ==========================================

.sns-fields {
    .form-field {

        // Error state for SNS fields
        &:has(.form-input.error) {
            label {
                color: #ee1100 !important;
            }
        }
    }

    label {
        color: #333;
    }

    .form-input {
        background-color: #333;
    }
}

// ==========================================
// IMAGE UPLOAD STYLES
// ==========================================

.image-upload-section {
    display: grid;
    grid-template-columns: 1fr 5fr;
    width: 100%;
    gap: 2rem;

}

.upload-group {
    display: flex;
    flex-direction: column;

    label:has(+ .upload-container .upload-box:hover) {
        color: white;
    }

    label:has(+ .desk-upload-grid .upload-box:hover) {
        color: white;
    }

    &:has(.desk-upload-grid .upload-box:hover) .upload-specs {
        color: white;
    }

    // Error states for image uploads
    &:has(.upload-box.error) {
        label {
            color: #ee1100 !important;
        }

        .upload-specs {
            color: #ee1100 !important;
        }
    }

    // Specific error states for desk upload grid
    &:has(.desk-upload-grid .upload-box.error) {
        label {
            color: #ee1100 !important;
        }

        .upload-specs {
            color: #ee1100 !important;
        }
    }
}

.desk-upload-grid {
    display: flex;
    justify-content: space-between;
}

.upload-box {
    width: 90px;
    aspect-ratio: 3/2;
    border: 1px solid #666;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:not(:first-child) {
        border-color: #333;

        .upload-text {
            color: #333;
        }
    }

    &:hover {
        border-color: white;

        .upload-text {
            color: white;
        }

        &+.upload-specs {
            color: white;
        }
    }

    &.has-image {
        border-style: solid;
        border-color: #667eea;
    }

    &.error {
        border-color: #ee1100;

        .upload-text {
            color: #ee1100;
        }
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

.upload-text {
    font-size: 0.6rem;
    font-weight: 600;
    color: #666;
    white-space: nowrap;
    transition: color 0.5s ease;
}

.upload-specs {
    font-size: 0.7rem;
    color: #666;
    line-height: 1.3;
    transition: color 0.5s ease;
    margin-top: 0.4rem;
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
}

// ==========================================
// TERMS AND ACTIONS
// ==========================================

.terms-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
    position: relative;
}

.terms-tooltip {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    margin-bottom: 22px;
    z-index: 1000;
    width: 600px;
    margin-left: calc(-1 * (600px - 100%) / 2);
    animation: fadeIn 0.3s ease-out;

    .tooltip-content {
        background: rgba(0, 0, 0, 0.9);
        color: #666;
        padding: 1.2rem;
        border: 1px solid #666;
        font-size: 0.6rem;
        line-height: 1.4;

        h3 {
            color: #888;
            font-size: 0.8rem;
            font-weight: 600;
            margin: 0 0 0.75rem 0;
        }

        ol {
            margin: 0;
            padding-left: 1rem;

            li {
                margin-bottom: 0.5rem;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }

        &:after {
            content: '';
            display: block;
            position: absolute;
            bottom: -8px;
            left: 200px;
            transform: rotate(-45deg);
            width: 16px;
            height: 16px;
            border-left: 1px solid #666;
            border-bottom: 1px solid #666;
            background-color: black;
            opacity: 1;
            z-index: 1;
        }
    }

    .tooltip-arrow {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid rgba(0, 0, 0, 0.9);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1.4;
    transition: all 0.3s ease;

    &.error {
        color: #ee1100;

        .checkmark {
            background-color: #ee1100;
        }

        .terms-link {
            color: #ee1100;
        }
    }

    &:hover {
        color: white;

        .checkmark {
            background: white;
        }

        .terms-link {
            color: white;
        }
    }
}

.checkbox {
    display: none;
}

.checkmark {
    width: 1.2rem;
    height: 1.2rem;
    background-color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    margin-top: 0.1rem;

    &::after {
        content: '✓';
        color: black;
        font-size: 0.9rem;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
}

.checkbox:checked+.checkmark {
    &::after {
        opacity: 1;
    }
}

.terms-link {
    color: #666;
    text-decoration: underline;
    transition: color 0.5s ease;

    &:hover {
        color: #5a6fd8;
    }
}

.action-buttons {
    display: flex;
    gap: 20px;
    padding-left: calc(50% + 10px);
}

.btn {
    outline: none;
    border: solid 1px #666;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-grow: 1;
    height: 32px;
    background: transparent;
    color: #666;

    &:hover {
        background: #ddd;
        color: black;
    }

    &:disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: not-allowed;
    }
}
</style>
