-- BENIN MUSIC SOCIAL - SUPABASE SQL SCHEMA

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_post_change ON posts;
DROP TRIGGER IF EXISTS on_like_change ON likes;
DROP TRIGGER IF EXISTS on_comment_change ON comments;
DROP TRIGGER IF EXISTS on_follow_change ON follows;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_posts_count();
DROP FUNCTION IF EXISTS update_likes_count();
DROP FUNCTION IF EXISTS update_comments_count();
DROP FUNCTION IF EXISTS update_follow_counts();
DROP TABLE IF EXISTS notifications, follows, songs, albums, artists, events, comments, likes, posts, profiles CASCADE;


-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'artist')),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: posts
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  link_title TEXT,
  link_description TEXT,
  link_image TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: likes
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- TABLE: comments
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: events
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  description_en TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  city TEXT,
  country TEXT DEFAULT 'Bénin',
  image_url TEXT,
  ticket_url TEXT,
  is_free BOOLEAN DEFAULT FALSE,
  price TEXT,
  category TEXT DEFAULT 'concert' CHECK (category IN ('concert', 'festival', 'showcase', 'album', 'other')),
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: artists
-- ============================================
CREATE TABLE IF NOT EXISTS artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  bio_en TEXT,
  image_url TEXT,
  cover_url TEXT,
  genre TEXT,
  city TEXT,
  country TEXT DEFAULT 'Bénin',
  generation TEXT CHECK (generation IN ('pioneer', 'new', 'emerging')),
  spotify_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  monthly_listeners INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: albums
-- ============================================
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cover_url TEXT,
  release_year INTEGER,
  spotify_url TEXT,
  apple_music_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: songs
-- ============================================
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration TEXT,
  youtube_url TEXT,
  spotify_url TEXT,
  cover_url TEXT,
  play_count INTEGER DEFAULT 0,
  release_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: follows
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ============================================
-- TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'event')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_insert"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts
CREATE POLICY "posts_public_read"  ON posts FOR SELECT USING (TRUE);
CREATE POLICY "posts_auth_insert"  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_own_update"   ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_own_delete"   ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "likes_public_read"  ON likes FOR SELECT USING (TRUE);
CREATE POLICY "likes_auth_insert"  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_own_delete"   ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_auth_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_own_delete"  ON comments FOR DELETE USING (auth.uid() = user_id);

-- Events & Artists : lecture publique, écriture admin uniquement via dashboard
CREATE POLICY "events_public_read"  ON events  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "artists_public_read" ON artists FOR SELECT USING (is_published = TRUE);
CREATE POLICY "albums_public_read"  ON albums  FOR SELECT USING (TRUE);
CREATE POLICY "songs_public_read"   ON songs   FOR SELECT USING (TRUE);

-- Notifications
CREATE POLICY "notifs_own_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_auth_insert" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "notifs_own_update"  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "follows_public_read" ON follows FOR SELECT USING (TRUE);
CREATE POLICY "follows_auth_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_own_delete"  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- FUNCTION: handle_new_user (trigger à l'inscription)
-- C'est cette fonction qui causait l'erreur "Database error saving new user"
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _display_name TEXT;
BEGIN
  -- Récupère le username depuis les metadata, sinon utilise la partie avant @ de l'email
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Récupère le display_name depuis les metadata, sinon utilise le username
  _display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    _username
  );

  -- Si le username existe déjà, ajoute un suffixe unique
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := _username || '_' || SUBSTR(NEW.id::TEXT, 1, 6);
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    _username,
    _display_name,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''), ''),
    'user'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur sans faire planter l'inscription
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCTION: update_posts_count
-- ============================================
DROP TRIGGER IF EXISTS on_post_change ON posts;
DROP FUNCTION IF EXISTS update_posts_count();

CREATE OR REPLACE FUNCTION update_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_posts_count();

-- ============================================
-- FUNCTION: update_likes_count
-- ============================================
DROP TRIGGER IF EXISTS on_like_change ON likes;
DROP FUNCTION IF EXISTS update_likes_count();

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ============================================
-- FUNCTION: update_comments_count
-- ============================================
DROP TRIGGER IF EXISTS on_comment_change ON comments;
DROP FUNCTION IF EXISTS update_comments_count();

CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ============================================
-- FUNCTION: update_follow_counts
-- ============================================
DROP TRIGGER IF EXISTS on_follow_change ON follows;
DROP FUNCTION IF EXISTS update_follow_counts();

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

