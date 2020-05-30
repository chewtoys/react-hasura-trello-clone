import React, { useState, FormEvent } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  Stack,
  Link as _Link,
  useColorMode,
} from "@chakra-ui/core";
import useFetch from "use-http";
import { NextPage } from "next";
import { cookieSetter } from "lib/cookie";
import Link from "next/link";

const SignIn: NextPage = () => {
  const { colorMode } = useColorMode();
  const bgColor = { light: "white", dark: "gray.800" };
  const borderColor = { light: "gray.300", dark: "gray.700" };
  const color = { light: "gray.900", dark: "gray.100" };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [request, response] = useFetch(`${process.env.AUTH_URL}`);

  const handleSubmit = async (e: FormEvent<HTMLInputElement>) => {
    e.preventDefault();

    const res = await request.post("/sign-in", {
      email,
      password,
    });

    if (response.ok) {
      cookieSetter("token", res.token);
      cookieSetter("user-id", res.id);

      window.location.href = "/";
    }
  };

  return (
    <Box
      minHeight={`calc(100vh - 80px)`}
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      maxWidth="400px"
      w="full"
      mx="auto"
    >
      {request.error ? (
        <Alert status="error" variant="left-accent" mb={8} w="full">
          <AlertIcon />
          There was an error processing your request. Please try again!
        </Alert>
      ) : null}
      <Box
        minWidth={["full", "full", "full", "400px"]}
        p={8}
        rounded="md"
        borderWidth={1}
        bg={bgColor[colorMode]}
        borderColor={borderColor[colorMode]}
        color={color[colorMode]}
      >
        <Box as="form" onSubmit={handleSubmit}>
          <Stack spacing={8}>
            <FormControl isRequired>
              <FormLabel htmlFor="email">Email address</FormLabel>
              <Input
                type="email"
                id="email"
                aria-describedby="Email address"
                placeholder="john@doe.com"
                value={email}
                onChange={(e: FormEvent<HTMLInputElement>) =>
                  setEmail(e.currentTarget.value)
                }
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                type="password"
                id="password"
                aria-describedby="Password"
                placeholder="******"
                value={password}
                onChange={(e: FormEvent<HTMLInputElement>) =>
                  setPassword(e.currentTarget.value)
                }
              />
            </FormControl>
            <FormControl>
              <Stack isInline spacing={4} align="center">
                <Box>
                  <Button
                    type="submit"
                    variantColor="cyan"
                    size="lg"
                    loadingText="Signing in..."
                    onClick={handleSubmit}
                    isLoading={request.loading}
                  >
                    Sign In
                  </Button>
                </Box>
                <Box>
                  <Link href="/sign-up">
                    <_Link>Sign Up</_Link>
                  </Link>
                </Box>
              </Stack>
            </FormControl>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default SignIn;
