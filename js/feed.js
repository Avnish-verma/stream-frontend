// js/feed.js
checkAuth(true); 

let feedPage = 1;
let loggedInUserFollowing = []; // Current user ki following list store karne ke liye
let currentUsername = null;

// 1. Current user ka profile data fetch karke following list nikalna
async function fetchCurrentUserFollowingList() {
  try {
    const response = await fetch(`${BASE_URL}/profile`, getFetchOptions('GET'));
    const result = await response.json();
    
    if (response.ok && result.success) {
      // following array me user ki IDs hoti hain
      loggedInUserFollowing = result.data.following || [];
      currentUsername = result.data.userId; // Apni khud ki post pe button hide karne ke liye
    }
  } catch (err) {
    console.error("Error fetching user profile for follow state:", err);
  }
}

async function fetchFeed() {
  const container = document.getElementById('posts-container');
  const loadBtn = document.getElementById('load-more-btn');
  
  // Pehle ensure karein ki logged-in user ki following list aagayi ho
  if (loggedInUserFollowing.length === 0 && currentUsername === null) {
    await fetchCurrentUserFollowingList();
  }

  if (loadBtn) loadBtn.innerText = "Loading...";

  try {
    const targetUrl = `${BASE_URL}/feed?page=${feedPage}&limit=5`;
    const response = await fetch(targetUrl, getFetchOptions('GET'));
    const result = await response.json();
    const posts = result.post || [];

    if (posts.length === 0 && feedPage === 1) {
      container.innerHTML = '<p style="text-align:center; color:#8e8e8e; margin-top:20px;">No posts available yet.</p>';
      if (loadBtn) loadBtn.style.display = 'none';
      return;
    }

    posts.forEach((item) => {
      const author = item.postedBy;
      const username = author?.fullname || author?.userId || 'User';
      const userHandle = author?.userId;
      const authorMongoId = author?._id;
      const avatar = author?.profilePic?.url || 'https://via.placeholder.com/150';
      const postId = item._id;
      const likesCount = item.likes ? item.likes.length : 0;
      
      // 2. FRONTEND MATCHING: Check if author's ID exists in logged-in user's following list
      const isFollowing = loggedInUserFollowing.some(id => id === authorMongoId);
      
      // Button state styling
      const btnText = isFollowing ? "Unfollow" : "Follow";
      const btnBg = isFollowing ? "#efefef" : "#0095f6";
      const btnColor = isFollowing ? "#262626" : "#fff";
      const btnId = `follow-btn-${userHandle}`;

      // Agar post khud ki hai toh follow button mat dikhao
      const isMyPost = (userHandle === currentUsername);

      const isVideo = item.postUrl && item.postUrl.endsWith('.mp4');
      const mediaHtml = isVideo 
        ? `<video src="${item.postUrl}" controls muted playsinline style="width: 100%;"></video>`
        : `<img src="${item.postUrl}" loading="lazy" alt="Post" style="width: 100%;">`;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="post-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px;">
          <div style="display: flex; align-items: center;">
            <img src="${avatar}" class="avatar" alt="${username}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 10px; background: #efefef;">
            <a href="profile.html?user=${userHandle}" style="font-weight: 600; font-size: 0.9rem; text-decoration: none; color: #262626;">${username}</a>
          </div>
          
          <!-- Dynamic Follow/Unfollow Button -->
          ${isMyPost ? '' : `
            <button id="${btnId}" onclick="toggleFeedFollow('${authorMongoId}', '${userHandle}')" style="background: ${btnBg}; color: ${btnColor}; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">
              ${btnText}
            </button>
          `}
        </div>
        
        <div class="media-container" style="width: 100%; background: #000; display: flex; justify-content: center;">
          ${mediaHtml}
        </div>
        
        <div class="post-footer" style="padding: 12px;">
          <div class="post-actions" style="display: flex; gap: 15px; margin-bottom: 8px; align-items: center;">
            <button onclick="toggleLike('${postId}')" style="background: none; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #0095f6; display: flex; align-items: center; gap: 4px;">
              ❤️ <span id="likes-count-${postId}">${likesCount}</span>
            </button>
            <button onclick="toggleCommentSection('${postId}')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="Comments">
              💬
            </button>
          </div>

          <div class="caption" style="font-size: 0.9rem; margin-bottom: 4px;">
            <b>${username}</b> ${item.caption || ''}
          </div>
          <div class="description" style="font-size: 0.8rem; color: #8e8e8e; margin-bottom: 10px;">
            ${item.description || ''}
          </div>

          <!-- Collapsible Comments Section -->
          <div id="comment-section-${postId}" style="display: none; border-top: 1px solid #efefef; padding-top: 10px; margin-top: 8px;">
            <div id="comments-list-${postId}" style="margin-bottom: 10px; font-size: 0.85rem; max-height: 150px; overflow-y: auto;">
              <span style="color: #8e8e8e;">Loading comments...</span>
            </div>
            
            <div class="comment-box" style="display: flex; border: 1px solid #dbdbdb; border-radius: 4px; padding: 4px 8px; background: #fafafa;">
              <input type="text" id="comment-input-${postId}" placeholder="Add a comment..." style="border: none; background: none; outline: none; font-size: 0.85rem; width: 100%; padding: 4px;">
              <button onclick="addComment('${postId}')" style="background: none; border: none; color: #0095f6; font-weight: 600; cursor: pointer; font-size: 0.85rem; padding-left: 8px;">Post</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    if (posts.length < 5) {
      if (loadBtn) loadBtn.style.display = 'none';
    } else {
      if (loadBtn) loadBtn.innerText = "Load More";
      feedPage++;
    }
  } catch (err) {
    console.error("Error loading feed:", err);
  }
}

// 3. Handle Follow/Unfollow Click & Update Local Array State
async function toggleFeedFollow(authorMongoId, userHandle) {
  const btn = document.getElementById(`follow-btn-${userHandle}`);
  if (!btn) return;

  const isCurrentlyFollowing = btn.innerText === "Unfollow";
  const actionRoute = isCurrentlyFollowing ? 'unfollow' : 'follow';
  
  try {
    const response = await fetch(`${BASE_URL}/profile/${actionRoute}/${userHandle}`, getFetchOptions('POST'));
    const result = await response.json();
    
    if (response.ok) {
      if (isCurrentlyFollowing) {
        // Unfollow hua toh local array se ID hata do
        loggedInUserFollowing = loggedInUserFollowing.filter(id => id !== authorMongoId);
        btn.innerText = "Follow";
        btn.style.background = "#0095f6";
        btn.style.color = "#fff";
      } else {
        // Follow hua toh local array me ID jod do
        loggedInUserFollowing.push(authorMongoId);
        btn.innerText = "Unfollow";
        btn.style.background = "#efefef";
        btn.style.color = "#262626";
      }
    } else {
      alert(result.message || "Action failed");
    }
  } catch (err) {
    console.error("Follow action error:", err);
  }
}

// Toggle Comment Section
function toggleCommentSection(postId) {
  const section = document.getElementById(`comment-section-${postId}`);
  if (section.style.display === 'none' || section.style.display === '') {
    section.style.display = 'block';
    loadComments(postId);
  } else {
    section.style.display = 'none';
  }
}

// Fetch comments
async function loadComments(postId) {
  const container = document.getElementById(`comments-list-${postId}`);
  try {
    const response = await fetch(`${BASE_URL}/post/comments/${postId}`, getFetchOptions('GET'));
    const result = await response.json();

    if (response.ok && result.data) {
      if (result.data.length === 0) {
        container.innerHTML = '<span style="color: #8e8e8e; font-size: 0.8rem;">No comments yet. Be the first to comment!</span>';
        return;
      }

      container.innerHTML = result.data.map(c => {
        const commenterAvatar = c.commentedBy?.profilePic?.url || 'https://via.placeholder.com/150';
        const commenterName = c.commentedBy?.userId || 'User';
        return `
          <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #f9f9f9; padding-bottom: 6px;">
            <img src="${commenterAvatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: #efefef;" alt="Avatar">
            <div>
              <b style="font-size: 0.8rem; color: #262626;">${commenterName}</b>
              <span style="font-size: 0.85rem; color: #333; margin-left: 4px;">${c.text}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    container.innerHTML = '<span style="color: #ed4956; font-size: 0.8rem;">Failed to load comments</span>';
  }
}

// Toggle Like
async function toggleLike(postId) {
  try {
    const response = await fetch(`${BASE_URL}/post/like/${postId}`, getFetchOptions('POST'));
    const result = await response.json();
    
    if (response.ok) {
      const likesSpan = document.getElementById(`likes-count-${postId}`);
      if (likesSpan) {
        likesSpan.innerText = result.data.likes.length;
      }
    }
  } catch (err) {
    console.error("Like error:", err);
  }
}

// Add Comment
async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();

  if (!text) return;

  try {
    const response = await fetch(`${BASE_URL}/post/comment/${postId}`, getFetchOptions('POST', { text }));
    const result = await response.json();

    if (response.ok) {
      input.value = '';
      loadComments(postId);
    } else {
      alert(result.message || "Failed to post comment");
    }
  } catch (err) {
    console.error("Comment error:", err);
  }
}

fetchFeed();