import React from "react";
import { isLoggedIn, setUser, getUser } from "../utils/auth";
import {
  createUser,
  getComments,
  addComment,
  deleteComment,
} from "../utils/server";
import { EpisodeCommentsDTO, TimeObject } from "../interfaces/outputs"; // Ensured TimeObject is imported
import "../../public/Comments.css";
import "../../public/colors.css";

interface CommentsProps {
  crunchy_id: string; // ID used to fetch comments
}

// Helper function to adapt a single comment's creationTime
const adaptCommentCreationTime = (
  comment: EpisodeCommentsDTO
): EpisodeCommentsDTO => {
  const currentCreationTime = comment.creationTime as any;
  if (typeof currentCreationTime === "string") {
    return {
      ...comment,
      creationTime: { Time: currentCreationTime, Valid: true } as TimeObject,
    };
  }
  // If not a string, return as is; formatDate will handle if it's not a valid TimeObject
  return comment;
};

// Helper function to adapt all comments in an array
const adaptAllComments = (
  comments: EpisodeCommentsDTO[]
): EpisodeCommentsDTO[] => {
  if (!Array.isArray(comments)) {
    console.warn("adaptAllComments received non-array input:", comments);
    return []; // Return empty array or handle error as appropriate
  }
  return comments.map(adaptCommentCreationTime);
};

const Comments: React.FC<CommentsProps> = ({ crunchy_id }: CommentsProps) => {
  const [comments, setComments] = React.useState<EpisodeCommentsDTO[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1); // New state for pagination

  // UX States
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isAddingComment, setIsAddingComment] = React.useState(false);
  const [deletingCommentId, setDeletingCommentId] = React.useState<
    string | null
  >(null);
  const [feedback, setFeedback] = React.useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [toast, setToast] = React.useState<{
    id: number;
    message: string;
    type: "success" | "error";
  } | null>(null); // New state for toast notifications

  const COMMENTS_PER_PAGE = 6;

  // Effect to auto-dismiss toast after a delay
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000); // Toast visible for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toast]);

  React.useEffect(() => {
    const fetchCommentsAndUser = async () => {
      setIsLoadingComments(true);
      setFeedback(null);
      if (crunchy_id) {
        try {
          const response = await getComments(crunchy_id);
          setComments(adaptAllComments(response));
        } catch (error) {
          console.error("Error fetching comments:", error);
          setComments([]);
          setFeedback({ message: "Failed to load comments.", type: "error" });
        } finally {
          setIsLoadingComments(false);
        }
      } else {
        setIsLoadingComments(false); // No crunchy_id, so not loading
      }
      const user = await getUser();
      if (user) {
        setCurrentUser(user.username);
      }
    };

    fetchCommentsAndUser();
  }, [crunchy_id]);

  const handleRegister = async () => {
    if (username.trim() === "") {
      setFeedback({ message: "Please enter a username.", type: "error" });
      return;
    }
    setIsRegistering(true);
    setFeedback(null);
    try {
      const userDTO = await createUser(username);
      setUser({ username: userDTO.name, token: userDTO.token });
      setCurrentUser(userDTO.name);
      setUsername("");
      setFeedback({ message: "Registered successfully!", type: "success" });
    } catch (error) {
      console.error("Error registering user:", error);
      setFeedback({
        message: "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === "") {
      setFeedback({ message: "Please enter a comment.", type: "error" });
      return;
    }
    if (!currentUser) {
      setFeedback({
        message: "Please register or log in to comment.",
        type: "error",
      });
      return;
    }
    setIsAddingComment(true);
    setFeedback(null); // Clear main feedback before operation
    try {
      await addComment(crunchy_id, newComment);
      setNewComment("");
      const freshComments = await getComments(crunchy_id);
      setComments(adaptAllComments(freshComments));
      setToast({ id: Date.now(), message: "Comment added!", type: "success" }); // Use toast for this success
    } catch (error) {
      console.error("Error adding comment:", error);
      setFeedback({
        message: "Failed to add comment. Please try again.",
        type: "error",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    setFeedback(null); // Clear main feedback
    try {
      await deleteComment(commentId);
      const freshComments = await getComments(crunchy_id);
      setComments(adaptAllComments(freshComments));
      setToast({
        id: Date.now(),
        message: "Comment deleted.",
        type: "success",
      }); // Use toast for this success
    } catch (error) {
      console.error("Error deleting comment:", error);
      setFeedback({
        message: "Failed to delete comment. Please try again.",
        type: "error",
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatDate = (timeObject: TimeObject) => {
    if (
      !timeObject ||
      typeof timeObject.Time !== "string" ||
      typeof timeObject.Valid !== "boolean"
    ) {
      return "Date data missing";
    }
    if (!timeObject.Valid) {
      return "Date not available";
    }
    try {
      const date = new Date(timeObject.Time);
      if (isNaN(date.getTime())) {
        return "Invalid date value";
      }
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", timeObject.Time, error);
      return "Error formatting date";
    }
  };

  // Pagination logic
  const indexOfLastComment = currentPage * COMMENTS_PER_PAGE;
  const indexOfFirstComment = indexOfLastComment - COMMENTS_PER_PAGE;
  const currentComments = comments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );
  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePageButtons = 5; // Max number of page buttons to show (excluding prev/next, including ellipses)
    const halfVisible = Math.floor(maxVisiblePageButtons / 2);

    if (totalPages <= maxVisiblePageButtons) {
      // Show all page numbers if total pages are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`pagination-button page-number-button ${
              currentPage === i ? "active" : ""
            }`}
            disabled={currentPage === i}
          >
            {i}
          </button>
        );
      }
    } else {
      // Logic for many pages: show first, last, current, and some around current with ellipses
      // Always show First Page
      pageNumbers.push(
        <button
          key={1}
          onClick={() => paginate(1)}
          className={`pagination-button page-number-button ${
            currentPage === 1 ? "active" : ""
          }`}
          disabled={currentPage === 1}
        >
          1
        </button>
      );

      let startPage = Math.max(
        2,
        currentPage -
          halfVisible +
          (currentPage > totalPages - halfVisible
            ? totalPages - currentPage - halfVisible + 1
            : 0)
      );
      let endPage = Math.min(
        totalPages - 1,
        currentPage +
          halfVisible -
          (currentPage < halfVisible + 1 ? halfVisible - currentPage + 1 : 0)
      );

      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis-start" className="pagination-ellipsis">
            ...
          </span>
        );
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`pagination-button page-number-button ${
              currentPage === i ? "active" : ""
            }`}
            disabled={currentPage === i}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis-end" className="pagination-ellipsis">
            ...
          </span>
        );
      }

      // Always show Last Page
      pageNumbers.push(
        <button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          className={`pagination-button page-number-button ${
            currentPage === totalPages ? "active" : ""
          }`}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="comments-container">
      <h2>Comments</h2>

      {/* Main Feedback Message Display (for registration, loading errors, etc.) */}
      {feedback && (
        <div className={`feedback-message ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Toast Notification Display */}
      {toast && (
        <div key={toast.id} className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {!currentUser && (
        <div className="register-section fade-in">
          <input
            type="text"
            placeholder="Enter username to comment"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            disabled={isRegistering}
          />
          <button
            onClick={handleRegister}
            className="register-button"
            disabled={isRegistering}
          >
            {isRegistering ? (
              <span className="spinner-small"></span>
            ) : (
              "Register / Login"
            )}
          </button>
        </div>
      )}

      {/* Loading State for Comments */}
      {isLoadingComments ? (
        <div className="loading-comments-section">
          <div className="spinner-large"></div>
          <p>Loading comments...</p>
        </div>
      ) : (
        <div className="comments-list">
          {
            currentComments.length > 0 // Use currentComments for rendering
              ? currentComments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className="comment-item fade-in"
                    style={{ "--comment-index": index } as React.CSSProperties}
                  >
                    <div className="comment-header">
                      <span className="comment-user">{comment.user}</span>
                      <span className="comment-date">
                        {formatDate(comment.creationTime)}
                      </span>
                    </div>
                    <div className="comment-text">{comment.comment}</div>
                    {currentUser === comment.user && (
                      <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="delete-button"
                          disabled={deletingCommentId === comment.id}
                        >
                          {deletingCommentId === comment.id ? (
                            <span className="spinner-small"></span>
                          ) : (
                            "X"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              : !feedback?.message && (
                  <p className="no-comments-message">No comments available.</p>
                )
            // Hide "No comments" if there's a feedback message like "Failed to load comments"
          }
        </div>
      )}

      {/* Pagination Controls */}
      {comments.length > COMMENTS_PER_PAGE && (
        <div className="pagination-controls">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button prev-button"
          >
            Previous
          </button>
          <div className="page-numbers-container">{renderPageNumbers()}</div>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button next-button"
          >
            Next
          </button>
        </div>
      )}

      {currentUser && (
        <div className="add-comment-section fade-in">
          <textarea
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="comment-textarea"
            disabled={isAddingComment}
          />
          <button
            onClick={handleAddComment}
            className="send-button"
            disabled={isAddingComment}
          >
            {isAddingComment ? <span className="spinner-small"></span> : "Send"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Comments;
