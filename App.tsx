import React, { useEffect, useState } from "react";
import { StatusBar, View, Text, Appearance, LogBox } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AppNavigator from "@/navigation/AppNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Font from "expo-font";

export default function App() {

 return (
   <GestureHandlerRootView style={{ flex: 1 }}>
     <SafeAreaProvider>
       {/* <AuthProvider> */}
         <SafeAreaView
           edges={["top", "left", "right", "bottom"]}
           style={{ flex: 1 }}
         >
           <StatusBar
            //  barStyle={colorScheme === "light" ? "dark-content" : "light-content"}
            //  backgroundColor={colors.background}
           />
             <AppNavigator />
         </SafeAreaView>
     </SafeAreaProvider>
   </GestureHandlerRootView>
   )}


