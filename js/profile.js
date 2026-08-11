// js/profile.js
checkAuth(true);

// URL se check karte hain ki kisi aur ki profile dekh rahe hain ya apni
const urlParams = new URLSearchParams(window.location.search);
const profileUserId = urlParams.get('user'); // e.g. profile.html?user=username

async function loadProfile() {
  const profileContainer = document.getElementById('profile-content');
  
  // Endpoint decide karna: Agar user parameter hai toh doosre ki profile, warna apni
  const endpoint = profileUserId ? `${BASE_URL}/profile/user/${profileUserId}` : `${BASE_URL}/profile`;

  try {
    const response = await fetch(endpoint, getFetchOptions('GET'));
    const result = await response.json();

    if (response.ok && result.success) {
      const user = result.data;
      
      let avatarUrl = 'https://via.placeholder.com/150';
      if (user.profilePic && user.profilePic.url) {
        avatarUrl = user.profilePic.url;
      }

      // Check karna ki ye apni profile hai ya kisi aur ki
      // (Agar profileUserId nahi hai, matlab khud ki hai)
    // Check karna ki ye apni profile hai ya kisi aur ki
      const isMyProfile = !profileUserId; 

      let actionButtonHtml = '';

      if (isMyProfile) {
        actionButtonHtml = `<button class="edit-profile-btn" onclick="toggleEditModal()">Edit Profile</button>`;
      } else {
        // Doosre ki profile hai toh Follow/Unfollow aur Message button dono dikhayenge
        const isFollowing = user.isFollowing;
        const btnText = isFollowing ? "Unfollow" : "Follow";
        const btnBg = isFollowing ? "#dbdbdb" : "#0095f6";
        const btnColor = isFollowing ? "#000" : "#fff";
        
        // Target user ki MongoDB ID chat partner banegi
        const targetMongoId = user.userId; // Assuming userId is unique and can be used for chat

        actionButtonHtml = `
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="edit-profile-btn" style="background: ${btnBg}; color: ${btnColor}; flex: 1;" onclick="toggleFollow('${user.userId}', ${isFollowing})">${btnText}</button>
            <button class="edit-profile-btn" style="background: #efefef; color: #262626; flex: 1;" onclick="window.location.href='chat.html?partner=${targetMongoId}'">Message</button>
          </div>
        `;
      }
      profileContainer.innerHTML = `
        <div class="profile-card">
          <img src="${avatarUrl}" class="profile-avatar" alt="Profile Picture">
          <div class="profile-name">${user.fullname || 'User'}</div>
          <div class="profile-handle">@${user.userId || 'username'}</div>
          <div class="profile-email">${user.emailId || ''}</div>
          
          <div>${user.gender ? `<span class="gender-badge">${user.gender}</span>` : ''}</div>
          ${user.bio ? `<div class="profile-bio">${user.bio}</div>` : ''}
          
          ${actionButtonHtml}

          <div class="profile-stats">
            <div class="stat-box">
              <span>${user.follower ? user.follower.length : 0}</span>
              <label>Followers</label>
            </div>
            <div class="stat-box">
              <span>${user.following ? user.following.length : 0}</span>
              <label>Following</label>
            </div>
          </div>
        </div>
      `;

      // Agar apni profile hai tabhi edit modal ke fields pre-fill honge
      if (isMyProfile) {
        if(user.bio) document.getElementById('prof-bio').value = user.bio;
        if(user.gender) document.getElementById('prof-gender').value = user.gender;
      }

    } else {
      profileContainer.innerHTML = '<div class="profile-card"><p style="color: #ed4956;">Failed to load profile.</p></div>';
    }
  } catch (err) {
    console.error("Profile Error:", err);
  }
}

// Follow / Unfollow Handler Function
async function toggleFollow(targetUserId, isCurrentlyFollowing) {
  // Aapke backend profileRouter me follow route '/follow/:userId' hai
  const actionRoute = isCurrentlyFollowing ? 'unfollow' : 'follow';
  const endpoint = `${BASE_URL}/profile/follow/${targetUserId}`;
  
  try {
    const response = await fetch(endpoint, getFetchOptions('POST'));
    const result = await response.json();
    
    if (response.ok) {
      loadProfile(); // Profile reload karke button state update kar do
    } else {
      alert(result.message || "Action failed");
    }
  } catch (err) {
    console.error("Follow/Unfollow error:", err);
  }
}

function toggleEditModal() {
  const modal = document.getElementById('editModal');
  if(modal) modal.classList.toggle('active');
}

loadProfile();