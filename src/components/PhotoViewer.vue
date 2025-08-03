<script setup>
import { ref, watch, nextTick, computed, onMounted, onBeforeUnmount } from 'vue';
import { gsap } from 'gsap';
import { audioManager } from '../utils/audioManager.js';

const props = defineProps({
    desk: Object,
    visible: Boolean,
    isSliderVisible: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['close', 'isTransitioning', 'photoVisible', 'firstPhotoLoaded', 'photoViewerReady', 'flashingComplete']);

const photoGalleryEl = ref(null);
const progressBarEl = ref(null);
const progressLoadedEl = ref(null);
const isProgressBarActive = ref(false);
const currentIndex = ref(0);
const isTransitioning = ref(false);
const stripesRef = ref(null);
const sliderContainer = ref(null);

const STAGGER_DELAY = 0.006;
const ANIMATION_DURATION = 0.8;
const ANIMATION_EASE = "power2.out";

const sliderNaturalWidth = ref(600);
const sliderNaturalHeight = ref(400);
const nextNaturalWidth = ref(600);
const nextNaturalHeight = ref(400);
const STRIPE_HEIGHT = 4; // px
const transitionDirection = ref(1); // 1 for next (right-to-left), -1 for prev (left-to-right)

const photoSizeCache = {}; // url -> {width, height}
const isSliderReady = ref(false);
const isSliderVisible = ref(false); // Controls actual slider visibility (delayed after flashing)
const isProgressBarComplete = ref(false);
const showCopyNotification = ref(false);

// Reactive window dimensions
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800);

// Array of colors for random progress bar background
const progressColors = ['#F76997', '#F8851F', '#9E7DF5', '#78BD4A', '#38C8E8'];
const currentProgressColor = ref('#F76997');
const backdropColor = ref('#222222'); // Separate color for backdrop, starts with default

// Helper function to calculate scaled dimensions that fill 70% viewport while maintaining aspect ratio
function getScaledDimensions(imageWidth, imageHeight) {
    const maxWidth = windowWidth.value * 0.7;
    const maxHeight = windowHeight.value * 0.7;
    const imageRatio = imageWidth / imageHeight;
    const viewportRatio = maxWidth / maxHeight;

    if (imageRatio > viewportRatio) {
        // Image is wider - fit to width
        return {
            width: maxWidth,
            height: maxWidth / imageRatio
        };
    } else {
        // Image is taller - fit to height
        return {
            width: maxHeight * imageRatio,
            height: maxHeight
        };
    }
}

// Computed properties for slider dimensions that always scale to 70% viewport
const sliderDisplayWidth = computed(() => {
    return getScaledDimensions(sliderNaturalWidth.value, sliderNaturalHeight.value).width;
});

const sliderDisplayHeight = computed(() => {
    return getScaledDimensions(sliderNaturalWidth.value, sliderNaturalHeight.value).height;
});

function preloadImagesAndUpdateProgress(desk) {
    const photos = desk.photos;
    const bar = progressBarEl.value;
    const loaded = progressLoadedEl.value;

    if (!bar || !loaded) return;

    // Select a random color for this progress bar session that's different from current
    let newColor;
    do {
        newColor = progressColors[Math.floor(Math.random() * progressColors.length)];
    } while (newColor === currentProgressColor.value && progressColors.length > 1);
    currentProgressColor.value = newColor;

    gsap.set(loaded, { width: '0%' });
    gsap.set(bar, { opacity: 0 });
    isProgressBarComplete.value = false;

    // If all images are already cached, still show progress bar animation
    const allCached = photos.every(url => photoSizeCache[url]);
    if (allCached) {
        const firstPhotoUrl = photos[0];
        const size = photoSizeCache[firstPhotoUrl];
        if (size) {
            sliderNaturalWidth.value = size.width;
            sliderNaturalHeight.value = size.height;
        }

        // Show progress bar animation even for cached images
        gsap.to(bar, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.inOut',
            onComplete: () => {

                setTimeout(() => {
                    // Animate progress bar to 100%
                    gsap.to(loaded, {
                        width: '100%',
                        duration: 0.5,
                        ease: 'power2.out',
                        onComplete: () => {
                            // Emit first photo loaded event when progress reaches 100%
                            emit('firstPhotoLoaded', firstPhotoUrl);
                            emit('photoVisible');

                            // Wait a bit more then show slider
                            setTimeout(() => {
                                isSliderReady.value = true;
                                emit('photoViewerReady', true);

                                // Delay showing the slider to allow flashing effect to complete
                                setTimeout(() => {
                                    isSliderVisible.value = true;
                                    emit('flashingComplete');
                                }, 500); // Wait 1.8 seconds for flashing effect to complete
                            }, 500);

                            setTimeout(() => {
                                // Update backdrop color to current progress color after transition is complete
                                backdropColor.value = currentProgressColor.value;
                            }, 2000);
                        }
                    });
                }, 1000);
            }
        });
        return;
    }

    gsap.to(bar, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
            setTimeout(() => {
                if (!photos || photos.length === 0) {
                    gsap.to(loaded, { width: '100%', duration: 0.5, delay: 0.5 });
                    return;
                }

                let loadedCount = 0;
                const totalImages = photos.length;
                let firstImageSizeSet = false;

                photos.forEach((photoUrl, idx) => {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        if (!photoSizeCache[photoUrl] && img.naturalWidth && img.naturalHeight) {
                            photoSizeCache[photoUrl] = { width: img.naturalWidth, height: img.naturalHeight };
                        }
                        loadedCount++;
                        const progress = loadedCount / totalImages;

                        // Set slider size from first image
                        if (!firstImageSizeSet && idx === 0 && img.naturalWidth && img.naturalHeight) {
                            sliderNaturalWidth.value = img.naturalWidth;
                            sliderNaturalHeight.value = img.naturalHeight;
                            firstImageSizeSet = true;
                        }

                        gsap.to(loaded, {
                            width: `${progress * 100}%`,
                            duration: 0.5,
                            ease: 'power2.out',
                            onComplete: () => {
                                // Only show slider when ALL images are loaded AND progress animation is complete
                                if (loadedCount === totalImages) {
                                    // Emit first photo loaded event when progress reaches 100%
                                    emit('firstPhotoLoaded', photos[0]);
                                    emit('photoVisible');

                                    setTimeout(() => {
                                        // Ensure slider size is set
                                        if (!firstImageSizeSet) {
                                            const firstPhotoUrl = photos[0];
                                            const size = photoSizeCache[firstPhotoUrl];
                                            if (size) {
                                                sliderNaturalWidth.value = size.width;
                                                sliderNaturalHeight.value = size.height;
                                            }
                                        }
                                        isSliderReady.value = true;
                                        emit('photoViewerReady', true);

                                        // Delay showing the slider to allow flashing effect to complete
                                        setTimeout(() => {
                                            isSliderVisible.value = true;
                                            emit('flashingComplete');
                                        }, 500); // Wait 1.8 seconds for flashing effect to complete
                                    }, 500);

                                    setTimeout(() => {
                                        // Update backdrop color to current progress color after transition is complete
                                        backdropColor.value = currentProgressColor.value;
                                    }, 2000);
                                }
                            }
                        });
                    };
                    img.src = photoUrl;
                });
            }, 1000);
        }
    });
}

function loadImageSize(url) {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;
    });
}

function getImageBoxInContainer(containerW, containerH, imageW, imageH) {
    // Returns {left, top, width, height} of the image as displayed in the container (background-size: contain)
    const containerRatio = containerW / containerH;
    const imageRatio = imageW / imageH;
    let width, height, left, top;
    if (imageRatio > containerRatio) {
        // Image fills width
        width = containerW;
        height = width / imageRatio;
        left = 0;
        top = (containerH - height) / 2;
    } else {
        // Image fills height
        height = containerH;
        width = height * imageRatio;
        top = 0;
        left = (containerW - width) / 2;
    }
    return { left, top, width, height };
}

async function goToSlide(nextIdx) {
    if (isTransitioning.value || nextIdx === currentIndex.value) return;
    emit('isTransitioning', true);

    const photos = props.desk?.photos || [];
    const currentSlideUrl = photos[currentIndex.value];
    const nextSlideUrl = photos[nextIdx];

    // Use cached sizes if available
    let currSize = photoSizeCache[currentSlideUrl];
    let nextSize = photoSizeCache[nextSlideUrl];

    // Fallback: if not cached (shouldn't happen after preload), load
    if (!currSize) currSize = await loadImageSize(currentSlideUrl);
    if (!nextSize) nextSize = await loadImageSize(nextSlideUrl);

    sliderNaturalWidth.value = currSize.width;
    sliderNaturalHeight.value = currSize.height;
    nextNaturalWidth.value = nextSize.width;
    nextNaturalHeight.value = nextSize.height;

    // Calculate displayed container size (current)
    const containerW = sliderContainer.value.offsetWidth;
    const containerH = sliderContainer.value.offsetHeight;

    // Calculate displayed image box for current image (in current container)
    const currBox = getImageBoxInContainer(containerW, containerH, currSize.width, currSize.height);

    // Calculate what the container size will be for the next image
    const nextScaledDimensions = getScaledDimensions(nextSize.width, nextSize.height);
    const nextContainerW = nextScaledDimensions.width;
    const nextContainerH = nextScaledDimensions.height;
    // Calculate displayed image box for next image (in next container)
    const nextBox = getImageBoxInContainer(nextContainerW, nextContainerH, nextSize.width, nextSize.height);

    // Stripe counts
    const currStripeCount = Math.ceil(currBox.height / STRIPE_HEIGHT);
    const nextStripeCount = Math.ceil(nextBox.height / STRIPE_HEIGHT);

    stripesRef.value.innerHTML = "";

    // Create current stripes (at displayed image box)
    for (let i = 0; i < currStripeCount; i++) {
        const stripe = document.createElement("div");
        stripe.className = "stripe current-stripe";
        stripe.style.position = "absolute";
        stripe.style.top = `${currBox.top + i * STRIPE_HEIGHT}px`;
        stripe.style.left = `${currBox.left}px`;
        stripe.style.width = `${currBox.width}px`;
        stripe.style.height = `${STRIPE_HEIGHT}px`;
        stripe.style.backgroundImage = `url(${currentSlideUrl})`;
        stripe.style.backgroundSize = `${currBox.width}px ${currBox.height}px`;
        stripe.style.backgroundPosition = `0px ${-i * STRIPE_HEIGHT}px`;
        stripe.style.zIndex = 3;
        // Set initial transform based on direction
        stripe.style.transform = "translateX(0)";
        stripesRef.value.appendChild(stripe);
    }
    // Create next stripes (at next image's displayed box in next container size, but overlayed in current container)
    // Center the next stripes in the current container
    const offsetTop = (containerH - nextBox.height) / 2;
    const offsetLeft = (containerW - nextBox.width) / 2;
    for (let i = 0; i < nextStripeCount; i++) {
        const stripe = document.createElement("div");
        stripe.className = "stripe next-stripe";
        stripe.style.position = "absolute";
        stripe.style.top = `${offsetTop + i * STRIPE_HEIGHT}px`;
        stripe.style.left = `${offsetLeft}px`;
        stripe.style.width = `${nextBox.width}px`;
        stripe.style.height = `${STRIPE_HEIGHT}px`;
        stripe.style.backgroundImage = `url(${nextSlideUrl})`;
        stripe.style.backgroundSize = `${nextBox.width}px ${nextBox.height}px`;
        stripe.style.backgroundPosition = `0px ${-i * STRIPE_HEIGHT}px`;
        stripe.style.zIndex = 2;
        // Set initial transform based on direction
        const slideDistance = (transitionDirection.value === 1
            ? nextBox.width + sliderContainer.value.offsetWidth
            : -nextBox.width - sliderContainer.value.offsetWidth);
        stripe.style.transform = `translateX(${slideDistance}px)`;
        stripesRef.value.appendChild(stripe);
    }

    isTransitioning.value = true;

    // Animate current stripes out
    const currentStripes = stripesRef.value.querySelectorAll(".current-stripe");
    gsap.to(currentStripes, {
        x: transitionDirection.value === 1 ? -window.innerWidth : window.innerWidth,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        stagger: { each: STAGGER_DELAY, from: "random" }
    });
    // Animate next stripes in
    const nextStripes = stripesRef.value.querySelectorAll(".next-stripe");
    gsap.to(nextStripes, {
        x: 0,
        duration: ANIMATION_DURATION,
        ease: ANIMATION_EASE,
        stagger: { each: STAGGER_DELAY, from: "random" },
        onComplete: () => {
            // After animation, update slider size and index
            sliderNaturalWidth.value = nextSize.width;
            sliderNaturalHeight.value = nextSize.height;
            currentIndex.value = nextIdx;
            stripesRef.value.innerHTML = "";
            isTransitioning.value = false;
            emit('isTransitioning', false);
        }
    });
}

function nextSlide() {
    if (!isSliderReady.value || isTransitioning.value || currentIndex.value >= props.desk.photos.length - 1) return;
    transitionDirection.value = 1;
    const photos = props.desk?.photos || [];
    goToSlide((currentIndex.value + 1) % photos.length);
}
function prevSlide() {
    if (!isSliderReady.value || isTransitioning.value || currentIndex.value <= 0) return;
    transitionDirection.value = -1;
    const photos = props.desk?.photos || [];
    goToSlide((currentIndex.value - 1 + photos.length) % photos.length);
}

function updateSliderSizeForCurrentImage() {
    const photos = props.desk?.photos || [];
    const url = photos[currentIndex.value];
    if (!url) return;
    const size = photoSizeCache[url];
    if (size) {
        sliderNaturalWidth.value = size.width;
        sliderNaturalHeight.value = size.height;
    }
}

function handleResize() {
    windowWidth.value = window.innerWidth;
    windowHeight.value = window.innerHeight;
}

// ==========================================
// SOCIAL SHARING FUNCTIONS
// ==========================================

function shareToFacebook() {
    const currentUrl = window.location.href;
    const shareText = `Check out ${props.desk.name}'s desk - ${props.desk.title} from ${props.desk.location}`;

    // Development note: Facebook sharing will be fully functional once deployed to a public domain
    if (currentUrl.includes('localhost')) {
        console.warn('🚨 Facebook Sharing Development Notice:');
        console.warn('Facebook cannot access localhost URLs or show rich previews in development.');
        console.warn('For full functionality:');
        console.warn('1. Deploy this app to a public domain (Vercel, Netlify, etc.)');
        console.warn('2. Configure the domain in Facebook Developer Dashboard');
        console.warn('3. Test with Facebook Sharing Debugger');
        console.warn('Current share text:', shareText);

        // Show user-friendly message
        if (confirm('📋 Facebook sharing requires a public domain to show rich previews.\n\nWould you like to copy the share text to clipboard instead?\n\n"' + shareText + '"')) {
            navigator.clipboard.writeText(`${shareText}\n\n${currentUrl}`).then(() => {
                alert('✅ Share text copied to clipboard!');
            }).catch(() => {
                prompt('Copy this share text:', `${shareText}\n\n${currentUrl}`);
            });
        }
        return;
    }

    // Update Open Graph meta tags dynamically for production
    updateOpenGraphTags();

    // Use the simple, reliable Facebook sharer URL
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;

    // Open in popup with optimal dimensions
    const width = 626;
    const height = 436;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
        facebookShareUrl,
        'facebookShare',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );

    if (popup) {
        popup.focus();
        console.log('Facebook share dialog opened');
        console.log('Note: Facebook will show rich preview based on page content. Users can add their own message.');
        console.log('Share text for reference:', shareText);
    } else {
        console.warn('Popup blocked, opening in new tab');
        window.open(facebookShareUrl, '_blank');
    }
}

function updateOpenGraphTags() {
    if (!props.desk) return;

    const currentUrl = window.location.href;
    const title = `${props.desk.name}'s Desk - ${props.desk.title}`;
    const description = `Check out ${props.desk.name}'s desk setup - ${props.desk.title} from ${props.desk.location}. A creative workspace that inspires.`;
    const image = props.desk.photos && props.desk.photos[0] ? props.desk.photos[0] : '';

    // Update or create Open Graph meta tags
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    if (image) {
        updateMetaTag('og:image', image);
    }

    // Also update Twitter Card tags for better social sharing
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (image) {
        updateMetaTag('twitter:image', image);
    }
}

function updateMetaTag(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);

    if (tag) {
        tag.setAttribute('content', content);
    } else {
        // Create new tag if it doesn't exist
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
    }
}

function shareToX() {
    const currentUrl = window.location.href;
    const shareText = `Check out ${props.desk.name}'s desk - ${props.desk.title} from ${props.desk.location}`;

    // Twitter/X allows pre-populated text via URL parameters
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(xUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
}

function shareToLinkedin() {
    const currentUrl = window.location.href;
    const shareText = `Check out ${props.desk.name}'s desk - ${props.desk.title} from ${props.desk.location}`;

    // Basic LinkedIn sharing (custom text limitations apply)
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');

    console.log('LinkedIn sharing opened. Note: Custom text cannot be pre-populated due to LinkedIn security policies.');
    console.log('Share text for reference:', shareText);
}

async function shareCopyLink() {
    const currentUrl = window.location.href;

    try {
        // Try to use the modern Clipboard API
        await navigator.clipboard.writeText(currentUrl);

        // Show visual notification
        showCopyNotification.value = true;
        setTimeout(() => {
            showCopyNotification.value = false;
        }, 2000);

        console.log('Link copied to clipboard:', currentUrl);

    } catch (err) {
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = currentUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            // Show visual notification
            showCopyNotification.value = true;
            setTimeout(() => {
                showCopyNotification.value = false;
            }, 2000);

            console.log('Link copied to clipboard (fallback):', currentUrl);
        } catch (fallbackErr) {
            console.error('Failed to copy link:', fallbackErr);
            alert('Unable to copy link. Please copy manually: ' + currentUrl);
        }
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
});

watch([() => props.desk, currentIndex], () => {
    updateSliderSizeForCurrentImage();
}, { immediate: true });

watch(() => props.visible, (newVal) => {
    if (newVal && props.desk) {
        // Reset backdrop color to default when PhotoViewer becomes visible
        backdropColor.value = '#222222';

        // Set slider size to first photo's natural size from cache immediately (prevents initial layout shift)
        const photos = props.desk.photos || [];
        const url = photos[0];
        const size = photoSizeCache[url];
        if (size) {
            sliderNaturalWidth.value = size.width;
            sliderNaturalHeight.value = size.height;
        }
        isProgressBarActive.value = true;
        isSliderReady.value = false;
        isSliderVisible.value = false;
        emit('photoViewerReady', false);
        isProgressBarComplete.value = false;
        nextTick(() => {
            preloadImagesAndUpdateProgress(props.desk);
        });
    } else {
        const gallery = photoGalleryEl.value;
        if (gallery) {
            setTimeout(() => {
                if (gallery) {
                    gallery.innerHTML = '';
                }
            }, 400);
        }
        const bar = progressBarEl.value;
        if (bar) {
            gsap.to(bar, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    isProgressBarActive.value = false;
                }
            });
        } else {
            isProgressBarActive.value = false;
        }
        isSliderReady.value = false;
        isSliderVisible.value = false;
        emit('photoViewerReady', false);
        isProgressBarComplete.value = false;
    }
});
watch(() => props.desk, () => {
    currentIndex.value = 0;
});

watch(() => props.desk, (newDesk, oldDesk) => {
    // If PhotoViewer is visible and desk has changed, trigger loading sequence
    if (props.visible && newDesk && oldDesk && newDesk.id !== oldDesk.id) {
        // Set slider size to first photo's natural size from cache immediately
        const photos = newDesk.photos || [];
        const url = photos[0];
        const size = photoSizeCache[url];
        if (size) {
            sliderNaturalWidth.value = size.width;
            sliderNaturalHeight.value = size.height;
        }

        // Reset states for new desk
        isProgressBarActive.value = true;
        isSliderReady.value = false;
        isSliderVisible.value = false;
        emit('photoViewerReady', false);
        isProgressBarComplete.value = false;

        // Start loading new desk's photos
        nextTick(() => {
            preloadImagesAndUpdateProgress(newDesk);
        });
    }
});
</script>

<template>
    <div>
        <!-- Full screen backdrop -->
        <transition name="backdrop-fade">
            <div
                v-if="visible"
                class="photoviewer-backdrop"
                :style="{ backgroundColor: backdropColor }"
            ></div>
        </transition>

        <div
            v-if="isProgressBarActive"
            ref="progressBarEl"
            class="progress-bar"
            :style="{ opacity: props.isSliderVisible ? 1 : 0 }"
        >
            <div
                ref="progressLoadedEl"
                class="progress-loaded"
                :style="{ backgroundColor: currentProgressColor }"
            ></div>
        </div>
        <transition name="fade-scale">
            <div
                v-if="isSliderVisible && visible && props.isSliderVisible"
                class="slider-wrapper"
            >
                <div
                    v-if="props.desk && props.desk.photos && props.desk.photos.length"
                    class="slider-container"
                    ref="sliderContainer"
                    :style="{
                        aspectRatio: sliderNaturalWidth + '/' + sliderNaturalHeight,
                        width: sliderDisplayWidth + 'px',
                        height: sliderDisplayHeight + 'px',
                    }"
                >
                    <div
                        class="slider-overlay"
                        :class="{ 'disabled': !isSliderReady || isTransitioning }"
                    >
                        <h3>Share this Desk</h3>
                        <h4>Use the buttons below to post this desk to a social network</h4>
                        <div class="social-buttons">
                            <a
                                @click="audioManager.play('photoviewer_click'), shareToFacebook()"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                class="social-icon"
                            >
                                <img
                                    src="../assets/icon_facebook.svg"
                                    alt="Facebook"
                                />
                            </a>
                            <a
                                @click="audioManager.play('photoviewer_click'), shareToX()"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                class="social-icon"
                            >
                                <img
                                    src="../assets/icon_x.svg"
                                    alt="X"
                                />
                            </a>
                            <a
                                @click="audioManager.play('photoviewer_click'), shareToLinkedin()"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                class="social-icon"
                            >
                                <img
                                    src="../assets/icon_linkedin.svg"
                                    alt="Linkedin"
                                />
                            </a>
                            <a
                                @click="audioManager.play('photoviewer_click'), shareCopyLink()"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                class="social-icon"
                            >
                                <img
                                    src="../assets/icon_copylink.svg"
                                    alt="Copy Link"
                                />
                            </a>
                        </div>
                        <div
                            class="slider-overlay-bg"
                            :style="{ backgroundColor: currentProgressColor }"
                        ></div>
                    </div>
                    <div
                        v-for="(photo, idx) in props.desk.photos"
                        :key="photo"
                        class="slide"
                        :style="{
                            backgroundImage: `url(${photo})`,
                            opacity: idx === currentIndex && !isTransitioning ? 1 : 0,
                            zIndex: idx === currentIndex ? 1 : 0,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }"
                    ></div>
                    <div
                        class="stripes"
                        ref="stripesRef"
                    ></div>
                </div>
                <div
                    class="slider-info"
                    :style="{
                        '--slider-width': sliderDisplayWidth + 'px',
                        '--slider-height': sliderDisplayHeight + 'px'
                    }"
                >
                    <div class="info-header">
                        <h3>{{ props.desk.name }}</h3>
                        <div
                            class="social-links"
                            v-if="props.desk.social"
                        >
                            <a
                                v-if="props.desk.social.facebook"
                                :href="props.desk.social.facebook"
                                target="_blank"
                                class="social-link facebook"
                                @click="audioManager.play('photoviewer_click')"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                title="Facebook"
                            >
                                <img
                                    src="../assets/icon_facebook.svg"
                                    alt="Facebook"
                                />
                            </a>
                            <a
                                v-if="props.desk.social.twitter"
                                :href="props.desk.social.twitter"
                                target="_blank"
                                class="social-link twitter"
                                @click="audioManager.play('photoviewer_click')"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                title="X (Twitter)"
                            >
                                <img
                                    src="../assets/icon_x.svg"
                                    alt="X"
                                />
                            </a>
                            <a
                                v-if="props.desk.social.linkedin"
                                :href="props.desk.social.linkedin"
                                target="_blank"
                                class="social-link linkedin"
                                @click="audioManager.play('photoviewer_click')"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                title="LinkedIn"
                            >
                                <img
                                    src="../assets/icon_linkedin.svg"
                                    alt="LinkedIn"
                                />
                            </a>
                            <a
                                v-if="props.desk.social.website"
                                :href="props.desk.social.website"
                                target="_blank"
                                class="social-link website"
                                @click="audioManager.play('photoviewer_click')"
                                @mouseenter="audioManager.play('photoviewer_hover')"
                                title="Website"
                            >
                                <img
                                    src="../assets/icon_home.svg"
                                    alt="Website"
                                />
                            </a>
                        </div>
                    </div>
                    <h4>{{ props.desk.title }} / {{ props.desk.location }}</h4>
                </div>
                <div
                    class="slider-pager"
                    :style="{
                        '--slider-width': sliderDisplayWidth + 'px',
                        '--slider-height': sliderDisplayHeight + 'px'
                    }"
                >
                    <div
                        v-for="(photo, idx) in props.desk.photos"
                        :key="idx"
                        class="slider-pager-item"
                        :class="{ active: idx === currentIndex, disabled: !isSliderReady }"
                        @click="!isSliderReady ? null : (audioManager.play('photoviewer_click'), goToSlide(idx))"
                        @mouseenter="!isSliderReady ? null : audioManager.play('photoviewer_hover')"
                    ></div>
                </div>
            </div>
        </transition>
        <div
            class="nav-button prev"
            :class="{ 'disabled': !isSliderReady || isTransitioning || currentIndex === 0 }"
            @click="(!isSliderReady || isTransitioning || currentIndex === 0) ? null : (audioManager.play('photoviewer_click'), prevSlide())"
            @mouseenter="(!isSliderReady || isTransitioning || currentIndex === 0) ? null : audioManager.play('photoviewer_hover')"
            v-if="props.desk && props.desk.photos && props.desk.photos.length > 1"
        >
            <div class="icon-wrapper">
                <div class="icon-line top"></div>
                <div class="icon-line bottom"></div>
            </div>
        </div>
        <div
            class="nav-button next"
            @click="(!isSliderReady || isTransitioning || currentIndex === (props.desk.photos.length - 1)) ? null : (audioManager.play('photoviewer_click'), nextSlide())"
            @mouseenter="(!isSliderReady || isTransitioning || currentIndex === (props.desk.photos.length - 1)) ? null : audioManager.play('photoviewer_hover')"
            v-if="props.desk && props.desk.photos && props.desk.photos.length > 1"
            :class="{ 'disabled': !isSliderReady || isTransitioning || currentIndex === (props.desk.photos.length - 1) }"
        >
            <div class="icon-wrapper">
                <div class="icon-line top"></div>
                <div class="icon-line bottom"></div>
            </div>
        </div>

        <!-- Copy Link Notification -->
        <transition name="copy-notification">
            <div
                v-if="showCopyNotification"
                class="copy-notification"
            >
                <div class="copy-notification-content">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    Link copied to clipboard!
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped lang="scss">
.photoviewer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #222222;
    z-index: 1;
    transition: background-color 0.4s ease;
    /* Above desk gallery/slider but below cloned desk and photoviewer */
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
    transition: opacity 0.4s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
    opacity: 0;
}

.backdrop-fade-enter-to,
.backdrop-fade-leave-from {
    opacity: 1;
}

.progress-bar {
    position: fixed;
    width: 100vw;
    height: 100vh;
    z-index: 5;
    /* Above backdrop but below cloned desk and photoviewer */
    background: transparent;
    top: 0;
    left: 0;
    opacity: 0;
    transition: opacity 0.4s ease;
}

.progress-loaded {
    width: 0;
    height: 100%;
    transition: width 0.1s ease-out;
}

.slider-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100vh - 110px);
    // height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 26;
    padding-top: 80px;
}

.slider-container {
    position: relative;
    max-width: 70vw;
    max-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slider-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 30;
    color: white;
    text-align: center;
    transition: opacity 0.4s ease;
    opacity: 0;

    &.disabled {
        pointer-events: none;
    }

    &:hover {
        opacity: 1;
    }

    h3 {
        font-size: 1.6rem;
    }

    h4 {
        margin-bottom: 15px;
        font-size: 0.8rem;
    }

    .social-buttons {
        display: flex;
        gap: 10px;

        .social-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            cursor: pointer;
            transition: opacity 0.3s ease;
            opacity: 1;

            img {
                width: 40px;
                height: 40px;
            }
        }

        // When hovering over the container, fade out all icons except the hovered one
        &:hover .social-icon:not(:hover) {
            opacity: 0.5;
        }
    }

    .slider-overlay-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        opacity: 0.5;
        /* Behind text */
    }
}

.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}

.stripes {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
}

.stripe {
    position: absolute;
    left: 0;
    width: 100%;
    /* height and background-size set dynamically */
}

.slider-info {
    position: absolute;
    top: calc(50vh + var(--slider-height) / 2);
    left: calc(50vw - var(--slider-width) / 2);
    width: var(--slider-width);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: top 0.4s ease, left 0.4s ease, width 0.4s ease;
    color: white;
    z-index: 39;

    .info-header {
        display: flex;
        // align-items: center;
        align-items: flex-end;
        gap: 1rem;
        margin-bottom: 5px;
    }

    h3 {
        margin: 0;
        font-size: 1.3rem;
        line-height: 1.1rem;
    }

    h4 {
        margin: 0;
        font-size: 0.7rem;
    }
}

.social-links {
    display: flex;
    gap: 4px;
    align-items: center;

    &:has(.social-link:hover) {
        .social-link {
            opacity: 0.5;
        }
    }
}

.social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    // width: 10px;
    // height: 10px;
    // border: 1px solid rgba(255, 255, 255, 0.3);
    background: transparent;
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
        //     background: white;
        //     border-color: white;
        opacity: 1 !important;
    }

    img {
        width: 12px;
        height: 12px;
        filter: brightness(0) invert(1); // Make SVG icons white by default
        transition: filter 0.3s ease;
    }

    // &:hover img {
    //     filter: brightness(0) invert(0); // Make SVG icons black on hover
    // }
}

.slider-pager {
    position: absolute;
    color: white;
    display: flex;
    top: calc(50vh + var(--slider-height) / 2);
    right: calc(50vw - var(--slider-width) / 2);
    z-index: 40;
    gap: 3px;
    transition: top 0.4s ease, right 0.4s ease, width 0.4s ease;
}

.slider-pager-item {
    width: 10px;
    height: 10px;
    background: transparent url('../src/assets/pager.svg') no-repeat center center;
    background-size: contain;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.5s ease;
    opacity: 0.5;

    &:hover {
        opacity: 1;
    }

    &.active {
        color: #333;
        font-weight: bold;
        opacity: 1;
    }

    &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
        pointer-events: none;
    }
}

.nav-button {
    position: fixed;
    border: none;
    padding: 15px;
    cursor: pointer;
    z-index: 27;
    top: 50%;
    transform: translateY(-50%);

    &.disabled {
        cursor: not-allowed;
        pointer-events: none;
        opacity: 0.4;
    }

    &.prev {
        left: 5px;

        .icon-line.top {
            transform: translateY(-5px) rotate(-45deg);
        }

        .icon-line.bottom {
            transform: translateY(5px) rotate(45deg);
        }
    }

    &.next {
        right: 5px;

        .icon-line.top {
            transform: translateY(-5px) rotate(45deg);
        }

        .icon-line.bottom {
            transform: translateY(5px) rotate(-45deg);
        }
    }

    &.disabled {
        pointer-events: none;
    }
}

.icon-wrapper {
    width: 20px;
    height: 20px;
    position: relative;
}

.icon-line {
    position: absolute;
    width: 80%;
    height: 3px;
    background-color: white;
    top: 50%;
    left: 0;
    border-radius: 1px;
    transform-origin: center;
    transition: transform 0.4s ease, top 0.4s ease;
}


/* CHEVRON -> BAR (when disabled) */
.nav-button.disabled .icon-line.top {
    transform: translateY(-5px) rotate(-90deg);
    width: 70%;
}

.nav-button.disabled .icon-line.bottom {
    transform: translateY(5px) rotate(90deg);
    width: 70%;
}

.nav-button.next.disabled .icon-line.top {
    transform: translateY(-5px) rotate(90deg);
    width: 70%;
}

.nav-button.next.disabled .icon-line.bottom {
    transform: translateY(5px) rotate(-90deg);
    width: 70%;
}


.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.5);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
    opacity: 1;
    transform: scale(1);
}

.copy-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 50;
    pointer-events: none;
}

.copy-notification-content {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);

    svg {
        flex-shrink: 0;
        color: #4ade80;
        /* Green checkmark */
    }
}

.copy-notification-enter-active,
.copy-notification-leave-active {
    transition: all 0.3s ease;
}

.copy-notification-enter-from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
}

.copy-notification-leave-to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
}

.copy-notification-enter-to,
.copy-notification-leave-from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}
</style>
