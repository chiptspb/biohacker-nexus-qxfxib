import React, { useEffect } from "react";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  return <Redirect href="/(tabs)/(home)/dashboard" />;
}
