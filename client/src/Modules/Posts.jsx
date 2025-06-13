import React, { useState, useEffect, useRef } from "react";
import GetDomain from "./GetDomain";

export const AddPost = async (Content, SetPosts) => {
  if (typeof SetPosts !== "function") return;

  const TrimmedContent = Content.trim();
  if (!TrimmedContent) return;

  const Token = sessionStorage.getItem("Token");
  if (!Token) return;

  try {
    const Response = await fetch(`${GetDomain()}/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Token}`,
      },
      body: JSON.stringify({ Content: TrimmedContent }),
    });

    if (!Response.ok) {
      await Response.json();
      return;
    }

    await FetchPosts(SetPosts);
  } catch {
    return;
  }
};

export const FetchPosts = async (SetPosts, SearchTerm = "") => {
  if (typeof SetPosts !== "function") return;

  const Token = sessionStorage.getItem("Token");
  if (!Token) return;

  try {
    const Url = new URL(`${GetDomain()}/posts`);
    if (SearchTerm.trim() !== "") Url.searchParams.append("search", SearchTerm.trim());

    const Response = await fetch(Url.toString(), {
      headers: { Authorization: `Bearer ${Token}` },
    });

    const Data = await Response.json();
    if (!Response.ok) return;

    const Posts = Data.Posts.map(Post => ({
      Id: Post.id,
      Username: Post.username || "Unknown",
      Content: Post.content,
      CreatedAt: Post.createdat,
      OwnerToken: Post.token || null,
    }));

    SetPosts(Posts);
  } catch {
    return;
  }
};

export const DeletePost = async (PostId, SetPosts) => {
  if (typeof SetPosts !== "function") return;

  const Token = sessionStorage.getItem("Token");
  if (!Token) return;

  try {
    const Response = await fetch(`${GetDomain()}/post/${PostId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${Token}` },
    });

    if (!Response.ok) return;

    await FetchPosts(SetPosts);
  } catch {
    return;
  }
};

export function PostInput({ SetPosts }) {
  if (typeof SetPosts !== "function") return null;

  const [Content, SetContent] = useState("");

  const HandlePost = async () => {
    if (!Content.trim()) return;
    await AddPost(Content, SetPosts);
    SetContent("");
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-4 mb-6 mt-10 md:mt-0 border border-gray-800">
      <textarea
        className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg p-3 resize-none placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        rows={3}
        placeholder="What's happening?"
        value={Content}
        onChange={e => SetContent(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            HandlePost();
          }
        }}
      />
      <div className="flex justify-end mt-3">
        <button
          className="bg-amber-500 text-black font-semibold px-5 py-2 rounded-lg hover:bg-amber-600 transition"
          onClick={HandlePost}
        >
          Post
        </button>
      </div>
    </div>
  );
}

const ExtractUrls = text => {
  const UrlRegex = /https?:\/\/[^\s]+/g;
  return text.match(UrlRegex) || [];
};

function ImageOrLink({ Url }) {
  const [IsImage, SetIsImage] = useState(null);

  useEffect(() => {
    let IsMounted = true;
    const Img = new Image();
    Img.src = Url;
    Img.onload = () => IsMounted && SetIsImage(true);
    Img.onerror = () => IsMounted && SetIsImage(false);
    return () => {
      IsMounted = false;
    };
  }, [Url]);

  if (IsImage === null) return <span>{Url}</span>;

  return IsImage ? (
    <img
      src={Url}
      alt="Embedded content"
      className="max-w-full max-h-64 rounded-md my-2 object-contain"
      loading="lazy"
    />
  ) : (
    <a
      href={Url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline break-words"
    >
      {Url}
    </a>
  );
}

function EmbedLinksWithImageCheck({ Content }) {
  if (!Content) return null;

  const Urls = ExtractUrls(Content);
  if (Urls.length === 0) {
    return Content.split("\n").map((Line, i) => (
      <React.Fragment key={i}>
        {Line}
        <br />
      </React.Fragment>
    ));
  }

  const Parts = [];
  let LastIndex = 0;

  Urls.forEach((Url, idx) => {
    const UrlIndex = Content.indexOf(Url, LastIndex);
    if (UrlIndex > LastIndex) Parts.push(Content.substring(LastIndex, UrlIndex));
    Parts.push(Url);
    LastIndex = UrlIndex + Url.length;
  });

  if (LastIndex < Content.length) Parts.push(Content.substring(LastIndex));

  return Parts.map((Part, idx) => {
    if (Urls.includes(Part)) return <ImageOrLink key={`url-${idx}`} Url={Part} />;
    return (
      <React.Fragment key={`text-${idx}`}>
        {Part.split("\n").map((Line, i) => (
          <React.Fragment key={i}>
            {Line}
            <br />
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  });
}

export function PostItem({ Post, SetPosts }) {
  if (typeof SetPosts !== "function") return null;

  const Token = sessionStorage.getItem("Token");
  const UserRole = sessionStorage.getItem("UserRole") || "User";
  const CanDelete = Token && Post.OwnerToken && (UserRole === "Admin" || Token === Post.OwnerToken);

  const HandleDelete = async () => {
    await DeletePost(Post.Id, SetPosts);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow p-4 mb-5 flex flex-col md:flex-row justify-between items-start gap-4">
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:gap-2 mb-2">
          <span className="font-bold text-amber-400 break-words">{Post.Username}</span>
          <span className="text-xs text-gray-500 md:ml-2 whitespace-nowrap">
            {new Date(Post.CreatedAt).toLocaleString()}
          </span>
        </div>
        <div className="text-sm text-gray-300 text-wrap break-all leading-relaxed">
          <EmbedLinksWithImageCheck Content={Post.Content} />
        </div>
      </div>
      {CanDelete && (
        <button
          onClick={HandleDelete}
          className="text-red-500 hover:text-red-700 font-semibold self-start md:self-auto"
          aria-label="Delete post"
        >
          Delete
        </button>
      )}
    </div>
  );
}

export function PostList({ Posts, SetPosts }) {
  if (typeof SetPosts !== "function") return null;

  return Posts.map(Post => <PostItem key={Post.Id} Post={Post} SetPosts={SetPosts} />);
}

export default function Posts() {
  const [Posts, SetPosts] = useState([]);
  const [SearchTerm, SetSearchTerm] = useState("");
  const SearchTimeout = useRef(null);

  useEffect(() => {
    FetchPosts(SetPosts);
  }, []);

  useEffect(() => {
    if (SearchTimeout.current) clearTimeout(SearchTimeout.current);

    SearchTimeout.current = setTimeout(() => {
      FetchPosts(SetPosts, SearchTerm);
    }, 250);

    return () => clearTimeout(SearchTimeout.current);
  }, [SearchTerm, SetPosts]);

  useEffect(() => {
    const IntervalId = setInterval(() => {
      FetchPosts(SetPosts, SearchTerm);
    }, 250);

    return () => clearInterval(IntervalId);
  }, [SearchTerm, SetPosts]);

  return (
    <div className="pt-20 mx-auto px-4 py-8 max-w-4xl sm:max-w-3xl md:max-w-6xl">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={SearchTerm}
          onChange={e => SetSearchTerm(e.target.value)}
          className="w-full p-2 rounded border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <PostInput SetPosts={SetPosts} />
      <PostList Posts={Posts} SetPosts={SetPosts} />
    </div>
  );
}
