self.addEventListener("activate", async(e)=>{
    const subscription=await self.ServiceWorkerRegistration.pushManager.subscribe({});
    console.log(subscription);
})