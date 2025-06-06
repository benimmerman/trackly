import React, { useEffect, useState } from "react";
import "../index.css";
import axiosInstance from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { selectList } from "../state/listSlice";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import Modal from "./helpers/Modal";
import { Spinner } from "./helpers/Spinner";
import { decrementTime } from "../state/countdownSlice";

const HomePage = () => {
  const HOME_API_URL = "home/";
  const NEW_LIST_API_URL = "list/";
  const DELETE_LIST_API_URL = "list/";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user);
  const [userLists, setUserLists] = useState({});
  const [showModal, setshowModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListTitleTouched, setNewListTitleTouched] = useState(false);
  const [newListTitleError, setNewListTitleError] = useState(false);

  // variable to show spinner
  const [showSpinner, setShowSpinner] = useState(false);
  // reusable style for button
  const modalButtonStyle =
    "flex w-auto justify-center items-center  rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm transition duration-300 p-4";

  // checks if there is a valid username in global state, if not get sent back to home page
  useEffect(() => {
    if (!userInfo.username) {
      navigate("/");
    }
  }, [userInfo.username, navigate]);

  // request sent to fetch all the lists owned by the user
  useEffect(() => {
    if (userInfo?.username) {
      axiosInstance
        .get(HOME_API_URL)
        .then((res) => {
          setUserLists(res.data.lists);
          dispatch(decrementTime());
          // console.log(['userLists', userLists])
        })
        .catch((err) => {
          dispatch(decrementTime());
          console.error("Failed to fetch home data", err);
        });
    }
  }, [userInfo.username]);

  // function to create new list
  const handleNewList = () => {
    axiosInstance
      .post(NEW_LIST_API_URL, {
        username: userInfo.username,
        listTitle: newListTitle,
      })
      .then((res) => {
        dispatch(
          selectList({
            listId: res.data.listId,
            listTitle: res.data.listTitle,
            fromNewList: true,
          })
        );
        dispatch(decrementTime());
        navigate("/list");
      })
      .catch((err) => dispatch(decrementTime()));
  };

  // function to view list selected
  const handleSelectList = (index) => {
    dispatch(
      selectList({
        listId: userLists.filter((_, i) => i === index)[0].listId,
        listTitle: userLists.filter((_, i) => i === index)[0].listTitle,
      })
    );
    navigate("/list");
  };

  // function to delete a list
  const handleDeleteList = () => {
    // showSpinner
    setShowSpinner(true);

    axiosInstance
      .delete(DELETE_LIST_API_URL, {
        params: { listId: userLists[deleteIndex].listId },
      })
      .then(() => {
        const updatedLists = [...userLists];
        updatedLists.splice(deleteIndex, 1);
        setUserLists(updatedLists);
        setDeleteIndex(null);
        // hide spinner and modal
        setShowSpinner(false);
        setshowModal(false);
        dispatch(decrementTime());
      })
      .catch((err) => {
        dispatch(decrementTime());
        // hide spinner and modal
        setShowSpinner(false);
        setshowModal(false);
        if (err.response && err.response.data.message) {
          console.error("Backend message:", err.response.data.message);
          // setErrorMessage(err.response.data.message);
        } else if (err.request) {
          console.error("No response from server:", err.request);
          // setErrorMessage("No response from server. Please try again.");
        } else {
          console.error("Error:", err.message);
          // setErrorMessage("An error occurred. Please try again.");
        }
      });
  };

  const handleConfirmDelete = (item, index) => {
    setDeleteTitle(item.listTitle);
    setDeleteIndex(index);
    setshowModal(true);
  };

  const handleNewListTitle = () => {
    console.log("newListTitle", newListTitle.trim());
    if (newListTitle.trim() !== "" && newListTitle !== null) {
      handleNewList();
    } else {
      setNewListTitleError(true);
    }
  };

  return (
    <div>
      <div className="max-w-7xl min-h-full mx-auto justify-center items-center">
        <div className="mt-2 p-2 mx-5">
          <div className="font-bold text-3xl  items-center flex">
            My Dashboard
            <PencilSquareIcon
              className="w-6 h-6 ml-2 cursor-pointer"
              title="Create New List"
              onClick={() => setNewListTitleTouched(true)}
            />
          </div>
          <div className=" text-gray-800 text-lg mt-2">
            View your existing lists or create a new one.
          </div>
        </div>
        <div className="w-full px-8 mt-8  grid h-56 grid-cols-1 content-start gap-4">
          {userLists.length > 0 &&
            userLists.map((item, index) => (
              <div
                key={index}
                className="flex  w-full bg-white p-4 rounded-xl  text-gray-700 
                text-lg font-medium shadow-md hover:shadow-xl hover:bg-white/40 cursor-pointer transition-all"
              >
                <div
                  className="w-full "
                  onClick={() => handleSelectList(index)}
                >
                  {item["listTitle"]}
                </div>
                <div className="justify-self-end self-center">
                  <TrashIcon
                    className="size-5"
                    onClick={() => handleConfirmDelete(item, index)}
                  />
                </div>
              </div>
            ))}
        </div>

        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => setshowModal(false)}
            title="Delete List?"
          >
            <p className="text-sm px-6 text-gray-600">
              Deleting {deleteTitle} will permanently remove it.
            </p>
            <div className="mt-4 sm:absolute sm:bottom-2 border-t space-x-4 pt-4 border-gray-200 left-0 right-3 flex justify-end">
              <button
                className={`${modalButtonStyle}  bg-white border-2 text-gray-500 uppercase  hover:bg-gray-500 hover:text-white`}
                onClick={() => setshowModal(false)}
              >
                Cancel
              </button>
              {showSpinner ? (
                <Spinner />
              ) : (
                <button
                  className={`${modalButtonStyle} bg-dark-purple text-white uppercase hover:bg-dark-purple/70`}
                  onClick={handleDeleteList}
                >
                  Delete
                </button>
              )}
            </div>
          </Modal>
        )}

        {newListTitleTouched && (
          <Modal
            isOpen={newListTitleTouched}
            onClose={() => {
              setNewListTitleTouched(false);
              setNewListTitleError(false);
            }}
            title="Give your new list a name"
          >
            <input
              type="text"
              value={newListTitle}
              placeholder={
                newListTitleError ? "List Name is required" : "List Name"
              }
              onChange={(e) => setNewListTitle(e.target.value)}
              className={`w-full p-2 border-2 border-gray-300 rounded-md ${
                newListTitleError ? "border-red-500" : ""
              }`}
            />
            <div className="mt-4 sm:absolute sm:bottom-2 border-t space-x-4 pt-4 border-gray-200 left-0 right-3 flex justify-end">
              <button
                className={`${modalButtonStyle}  bg-white border-2 text-gray-500 uppercase  hover:bg-gray-500 hover:text-white`}
                onClick={() => {
                  setNewListTitleTouched(false);
                  setNewListTitleError(false);
                }}
              >
                Cancel
              </button>
              {showSpinner ? (
                <Spinner />
              ) : (
                <button
                  className={`${modalButtonStyle} bg-dark-purple text-white uppercase hover:bg-dark-purple/70`}
                  onClick={handleNewListTitle}
                >
                  Create
                </button>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default HomePage;
