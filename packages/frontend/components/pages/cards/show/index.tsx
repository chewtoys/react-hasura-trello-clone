import React, { useState, FormEvent } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  Link as _Link,
  Stack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useColorMode,
  Textarea,
  Grid,
  Heading,
  Avatar,
  Text,
  Icon,
} from "@chakra-ui/core";
import { NextPage } from "next";
import gql from "graphql-tag";
import { useQuery, useMutation, useSubscription } from "react-apollo";
import Loader from "components/loader";
import { useRouter } from "next/router";
import Board from "components/pages/boards/show";
import { cookieParser } from "lib/cookie";

const FETCH_CARD_QUERY = gql`
  query fetchCard($id: uuid!) {
    card_by_pk(id: $id) {
      id
      title
      description
      board_id
    }
  }
`;

const UPDATE_CARD_MUTATION = gql`
  mutation updateCard($id: uuid!, $description: String, $title: String) {
    update_card(
      where: { id: { _eq: $id } }
      _set: { description: $description, title: $title }
    ) {
      returning {
        id
        title
        description
      }
    }
  }
`;

const FETCH_COMMENTS_SUBSCRIPTION = gql`
  subscription fetchComments($cardId: uuid!) {
    comment(
      where: { card_id: { _eq: $cardId } }
      order_by: { updated_at: desc }
    ) {
      id
      body
      updated_at
      author {
        email
      }
    }
  }
`;

const INSERT_COMMENT_MUTATION = gql`
  mutation insertComment($authorId: uuid!, $cardId: uuid!, $body: String) {
    insert_comment(
      objects: { author_id: $authorId, card_id: $cardId, body: $body }
    ) {
      returning {
        id
      }
    }
  }
`;

const MyProfile: NextPage = () => {
  const currentUserId = cookieParser("user-id");
  const { colorMode } = useColorMode();
  const bgColor = { light: "white", dark: "gray.800" };
  const color = { light: "gray.900", dark: "gray.100" };
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const currentCardId = router.query.cardId;

  const {
    data: fetchCardData,
    loading: fetchCardLoading,
    error: fetchCardError,
  } = useQuery(FETCH_CARD_QUERY, {
    variables: { id: currentCardId },
    onCompleted: (data) => {
      const { title, description } = data.card_by_pk;

      setTitle(title || "");
      setDescription(description || "");
    },
  });

  const {
    data: fetchCommentsData,
    loading: fetchCommentsLoading,
    error: fetchCommentsError,
  } = useSubscription(FETCH_COMMENTS_SUBSCRIPTION, {
    variables: { cardId: currentCardId },
  });

  const [
    updateCard,
    { loading: cardMutationLoading, error: cardMutationError },
  ] = useMutation(UPDATE_CARD_MUTATION);

  const [
    insertComment,
    { loading: commentMutationLoading, error: commentMutationError },
  ] = useMutation(INSERT_COMMENT_MUTATION);

  if (fetchCardLoading) {
    return <Loader />;
  }

  if (fetchCardError) {
    return <p>Error: {fetchCardError.message}</p>;
  }

  const { board_id } = fetchCardData.card_by_pk;

  const handleCardDetailsSubmit = async () => {
    await updateCard({
      variables: {
        id: currentCardId,
        title,
        description,
      },
    });

    if (!cardMutationError) {
      router.push(
        `/boards/[boardId]?boardId=${board_id}`,
        `/boards/${board_id}`
      );
    }
  };

  const handleCommentSubmit = async () => {
    await insertComment({
      variables: {
        cardId: currentCardId,
        authorId: currentUserId,
        body: comment,
      },
    });

    if (!cardMutationError) {
      setComment("");
    }
  };

  const formNode = () => {
    return (
      <Box>
        <Stack spacing={4}>
          <Box>
            <Heading as="h5" size="sm">
              Details
            </Heading>
          </Box>
          <Box>
            <Stack spacing={8}>
              <FormControl isRequired>
                <FormLabel htmlFor="title">Title</FormLabel>
                <Input
                  type="title"
                  id="title"
                  aria-describedby="title"
                  placeholder="Create a card for my work"
                  value={title}
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setTitle(e.currentTarget.value)
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Textarea
                  type="description"
                  id="description"
                  aria-describedby="Description"
                  placeholder="Create a card for my work"
                  value={description}
                  onChange={(e: FormEvent<HTMLInputElement>) =>
                    setDescription(e.currentTarget.value)
                  }
                  height="300px"
                />
              </FormControl>
            </Stack>
          </Box>
          <Box w="full">
            <Stack isInline spacing={4} alignItems="center">
              <Box>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/boards/[boardId]?boardId=${board_id}`,
                      `/boards/${board_id}`
                    )
                  }
                >
                  Cancel
                </Button>
              </Box>
              <Box>
                <Button
                  variantColor="cyan"
                  loadingText="Saving..."
                  onClick={handleCardDetailsSubmit}
                  isLoading={cardMutationLoading}
                  size="sm"
                >
                  Post
                </Button>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  };

  const activityNode = (comment: any) => {
    return (
      <Box key={comment.id}>
        <Stack spacing={2}>
          <Box>
            <Stack isInline spacing={4} alignItems="center">
              <Box>
                <Avatar size="sm" name={comment.author.email} />
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="bold">
                  {comment.author.email}
                </Text>
              </Box>
              <Box>
                <Stack isInline spacing={2} alignItems="center">
                  <Box>
                    <Icon name="time" size="12px" />
                  </Box>
                  <Box>
                    <Text fontSize="sm">{comment.updated_at}</Text>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
          <Box w="full">
            <Text fontSize="md">{comment.body}</Text>
          </Box>
        </Stack>
      </Box>
    );
  };

  const activityFormNode = () => {
    return (
      <Box>
        <Stack spacing={4}>
          <Box>
            {commentMutationError ? (
              <Alert status="error" variant="left-accent">
                <AlertIcon />
                There was an error processing your request. Please try again!
              </Alert>
            ) : null}
          </Box>
          <Box>
            <Stack isInline spacing={4} alignItems="center">
              <Box>
                <Avatar size="sm" name="John Doe" />
              </Box>
              <Box w="full">
                <Text fontSize="md" fontWeight="bold">
                  John Doe
                </Text>
              </Box>
            </Stack>
          </Box>
          <Box w="full">
            <Textarea
              fontSize="md"
              placeholder="Write a comment"
              value={comment}
              onChange={(e: FormEvent<HTMLInputElement>) =>
                setComment(e.currentTarget.value)
              }
            />
          </Box>
          <Box w="full">
            <Stack isInline spacing={4} alignItems="center">
              <Box>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComment("")}
                >
                  Cancel
                </Button>
              </Box>
              <Box>
                <Button
                  variantColor="cyan"
                  loadingText="Saving..."
                  onClick={handleCommentSubmit}
                  isLoading={commentMutationLoading}
                  size="sm"
                >
                  Post
                </Button>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  };

  const activitiesNode = () => {
    if (fetchCommentsLoading) {
      return <Loader />;
    }

    return (
      <Box>
        <Stack spacing={4}>
          <Box>
            <Heading as="h5" size="sm">
              Activities
            </Heading>
          </Box>
          <Box>
            <Stack spacing={8}>
              {activityFormNode()}
              {fetchCommentsError ? (
                <Alert status="error" variant="left-accent">
                  <AlertIcon />
                  There was an error processing your request. Please try again!
                </Alert>
              ) : null}
              {!!fetchCommentsData &&
                fetchCommentsData.comment.map((comment: any) => {
                  return activityNode(comment);
                })}
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  };

  const settingsNode = () => {
    return (
      <Box>
        <Stack spacing={4}>
          <Box>
            <Heading as="h5" size="sm">
              Settings
            </Heading>
          </Box>
          <Box>
            <Button
              variant="solid"
              w="full"
              leftIcon="email"
              justifyContent="flex-start"
            >
              Members
            </Button>
          </Box>
          <Box>
            <Button
              variant="solid"
              w="full"
              leftIcon="email"
              justifyContent="flex-start"
            >
              Labels
            </Button>
          </Box>
          <Box>
            <Button
              variant="solid"
              w="full"
              leftIcon="email"
              justifyContent="flex-start"
            >
              Due date
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  };

  const actionsNode = () => {
    return (
      <Box>
        <Stack spacing={4}>
          <Box>
            <Heading as="h5" size="sm">
              Actions
            </Heading>
          </Box>
          <Box>
            <Button
              variant="solid"
              w="full"
              leftIcon="email"
              justifyContent="flex-start"
            >
              Move card
            </Button>
          </Box>
          <Box>
            <Button
              variant="solid"
              w="full"
              leftIcon="email"
              justifyContent="flex-start"
            >
              Copy card
            </Button>
          </Box>
          <Box>
            <Button
              variant="solid"
              w="full"
              leftIcon="email"
              justifyContent="flex-start"
            >
              Archive
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <>
      <Drawer
        isOpen
        placement="right"
        size="xl"
        onClose={() =>
          router.push(
            `/boards/[boardId]?boardId=${board_id}`,
            `/boards/${board_id}`
          )
        }
      >
        <DrawerOverlay />
        <DrawerContent
          bg={bgColor[colorMode]}
          color={color[colorMode]}
          overflowY="scroll"
        >
          <DrawerCloseButton />
          <DrawerHeader>Update Card</DrawerHeader>
          <DrawerBody>
            {cardMutationError ? (
              <Alert status="error" variant="left-accent">
                <AlertIcon />
                There was an error processing your request. Please try again!
              </Alert>
            ) : null}
            <Grid templateColumns="3fr 1fr" gap={8}>
              <Stack spacing={16}>
                {formNode()}
                {activitiesNode()}
              </Stack>
              <Box position="sticky" top={0} alignSelf="flex-start">
                <Stack spacing={16}>
                  {settingsNode()}
                  {actionsNode()}
                </Stack>
              </Box>
            </Grid>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Board boardId={board_id} />
    </>
  );
};

export default MyProfile;
